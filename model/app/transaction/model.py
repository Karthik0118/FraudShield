"""GAT + 1D CNN + Fusion neural network for transaction fraud detection.

Architecture
────────────
                 Previous 10 Transactions
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
          GAT Component       CNN Component
          (graph repr)        (temporal seq)
                │                   │
                └─────────┬─────────┘
                          │
                     Fusion Layer
                          │
                 Current Transaction
                   Feature Vector
                          │
                          ▼
                  Classification Head
                          │
                          ▼
                  Fraud Probability

GAT component
─────────────
Uses ``torch_geometric``-free GAT implementation built on pure PyTorch.
This avoids a heavy dependency while still providing multi-head attention
over the local transaction graph.

Why GAT over basic GCN:
  - Edge features (amounts, timing, frequency) are critical signals.
  - Attention mechanism naturally weights important relationships.
  - Works well on small, variable-size graphs (1–11 nodes).
  - No global graph structure needed.

CNN component
─────────────
A 1-D convolutional network that processes the chronological sequence
of transaction feature vectors. Uses two conv layers with ReLU, batch
normalization, and adaptive pooling to produce a fixed-size representation
regardless of sequence length.

Fusion
──────
The GAT output, CNN output, and current transaction features are
concatenated and passed through a two-layer MLP to produce the final
fraud probability.
"""

from __future__ import annotations

import math
from typing import Dict, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F

from app.transaction.config import (
    CNN_CHANNELS,
    CNN_KERNEL_SIZE,
    FUSION_HIDDEN_DIM,
    GAT_HEADS,
    GAT_HIDDEN_DIM,
    GAT_OUTPUT_DIM,
    MAX_PREVIOUS_TRANSACTIONS,
)
from app.transaction.features import NUM_FEATURES
from app.transaction.graph import EDGE_FEATURE_DIM, NODE_FEATURE_DIM


# ═══════════════════════════════════════════════════════════════════════════════
# GAT Layer (pure PyTorch — no torch_geometric dependency)
# ═══════════════════════════════════════════════════════════════════════════════

class GATLayer(nn.Module):
    """Single-layer multi-head Graph Attention with edge features.

    Implements the attention mechanism from Veličković et al. (2018)
    extended to incorporate edge features via concatenation before
    computing attention coefficients.
    """

    def __init__(
        self,
        in_dim: int,
        out_dim: int,
        edge_dim: int,
        heads: int = 4,
        dropout: float = 0.1,
        concat: bool = True,
    ) -> None:
        super().__init__()
        self.in_dim = in_dim
        self.out_dim = out_dim
        self.heads = heads
        self.concat = concat
        self.dropout = dropout

        # Per-head linear projections
        self.W = nn.Linear(in_dim, heads * out_dim, bias=False)
        # Attention: a^T [Wh_i || Wh_j || e_ij]
        self.attn = nn.Linear(2 * out_dim + edge_dim, 1, bias=False)
        self.edge_proj = nn.Linear(edge_dim, edge_dim, bias=True)

        self.leaky_relu = nn.LeakyReLU(0.2)
        self.reset_parameters()

    def reset_parameters(self) -> None:
        nn.init.xavier_uniform_(self.W.weight)
        nn.init.xavier_uniform_(self.attn.weight)
        nn.init.xavier_uniform_(self.edge_proj.weight)

    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: torch.Tensor,
    ) -> torch.Tensor:
        """
        Parameters
        ----------
        x : [N, in_dim]
        edge_index : [2, E]
        edge_attr : [E, edge_dim]

        Returns
        -------
        [N, heads * out_dim]  if concat else [N, out_dim]
        """
        N = x.size(0)
        E = edge_index.size(1)

        # Project nodes
        h = self.W(x).view(N, self.heads, self.out_dim)  # [N, H, D]

        if E == 0:
            # No edges — return projected features unchanged
            if self.concat:
                return h.reshape(N, self.heads * self.out_dim)
            return h.mean(dim=1)

        src, dst = edge_index[0], edge_index[1]  # [E]

        # Edge features
        e = self.edge_proj(edge_attr)  # [E, edge_dim]

        # Compute attention for each head
        outputs = []
        for head in range(self.heads):
            h_head = h[:, head, :]  # [N, D]
            h_src = h_head[src]     # [E, D]
            h_dst = h_head[dst]     # [E, D]

            attn_input = torch.cat([h_src, h_dst, e], dim=-1)  # [E, 2D + edge_dim]
            attn_coeff = self.leaky_relu(self.attn(attn_input).squeeze(-1))  # [E]

            # Sparse softmax over incoming edges per node
            attn_coeff = self._sparse_softmax(attn_coeff, dst, N)
            attn_coeff = F.dropout(attn_coeff, p=self.dropout, training=self.training)

            # Weighted message aggregation
            msg = h_src * attn_coeff.unsqueeze(-1)  # [E, D]
            out = torch.zeros(N, self.out_dim, device=x.device)
            out.scatter_add_(0, dst.unsqueeze(-1).expand_as(msg), msg)
            outputs.append(out)

        if self.concat:
            return torch.cat(outputs, dim=-1)  # [N, H * D]
        return torch.stack(outputs, dim=0).mean(dim=0)  # [N, D]

    @staticmethod
    def _sparse_softmax(
        values: torch.Tensor,
        indices: torch.Tensor,
        num_nodes: int,
    ) -> torch.Tensor:
        """Softmax over values grouped by ``indices``."""
        max_vals = torch.full((num_nodes,), -1e9, device=values.device)
        max_vals.scatter_reduce_(0, indices, values, reduce="amax", include_self=False)
        exp_vals = torch.exp(values - max_vals[indices])
        sum_exp = torch.zeros(num_nodes, device=values.device)
        sum_exp.scatter_add_(0, indices, exp_vals)
        return exp_vals / (sum_exp[indices] + 1e-8)


class GATComponent(nn.Module):
    """Two-layer GAT that produces a fixed-size graph embedding."""

    def __init__(
        self,
        node_dim: int = NODE_FEATURE_DIM,
        edge_dim: int = EDGE_FEATURE_DIM,
        hidden_dim: int = GAT_HIDDEN_DIM,
        output_dim: int = GAT_OUTPUT_DIM,
        heads: int = GAT_HEADS,
    ) -> None:
        super().__init__()
        self.gat1 = GATLayer(node_dim, hidden_dim, edge_dim, heads=heads, concat=True)
        self.gat2 = GATLayer(
            hidden_dim * heads, output_dim, edge_dim, heads=1, concat=False,
        )
        self.norm1 = nn.LayerNorm(hidden_dim * heads)
        self.norm2 = nn.LayerNorm(output_dim)

    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: torch.Tensor,
    ) -> torch.Tensor:
        """Return a single vector summarising the graph ``[output_dim]``."""
        h = self.gat1(x, edge_index, edge_attr)
        h = self.norm1(h)
        h = F.elu(h)
        h = self.gat2(h, edge_index, edge_attr)
        h = self.norm2(h)
        h = F.elu(h)
        # Global mean pool → single graph vector
        return h.mean(dim=0)  # [output_dim]


# ═══════════════════════════════════════════════════════════════════════════════
# 1-D CNN Component
# ═══════════════════════════════════════════════════════════════════════════════

class CNNComponent(nn.Module):
    """1-D CNN for temporal transaction sequence analysis.

    Input: ``[batch, seq_len, features]``  (but we treat batch=1 during
    inference).  The conv layers slide over the time axis.
    """

    def __init__(
        self,
        in_features: int = NUM_FEATURES,
        channels: int = CNN_CHANNELS,
        kernel_size: int = CNN_KERNEL_SIZE,
        output_dim: int = GAT_OUTPUT_DIM,
        seq_len: int = MAX_PREVIOUS_TRANSACTIONS,
    ) -> None:
        super().__init__()
        # Conv operates on [batch, channels, seq_len]
        self.conv1 = nn.Conv1d(in_features, channels, kernel_size, padding=kernel_size // 2)
        self.bn1 = nn.BatchNorm1d(channels)
        self.conv2 = nn.Conv1d(channels, channels, kernel_size, padding=kernel_size // 2)
        self.bn2 = nn.BatchNorm1d(channels)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(channels, output_dim)

    def forward(
        self,
        sequence: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Parameters
        ----------
        sequence : [seq_len, features]  or  [batch, seq_len, features]
        mask : [seq_len]  or  [batch, seq_len]

        Returns
        -------
        [output_dim]  or  [batch, output_dim]
        """
        squeezed = False
        if sequence.dim() == 2:
            sequence = sequence.unsqueeze(0)  # [1, S, F]
            if mask is not None:
                mask = mask.unsqueeze(0)
            squeezed = True

        # Apply mask: zero out padded positions
        if mask is not None:
            sequence = sequence * mask.unsqueeze(-1).float()

        # Conv1d expects [batch, channels, seq_len]
        x = sequence.permute(0, 2, 1)  # [B, F, S]
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x).squeeze(-1)   # [B, channels]
        x = self.fc(x)                 # [B, output_dim]

        if squeezed:
            x = x.squeeze(0)  # [output_dim]
        return x


# ═══════════════════════════════════════════════════════════════════════════════
# Fusion + Classification Head
# ═══════════════════════════════════════════════════════════════════════════════

class TransactionFraudModel(nn.Module):
    """Full GAT + CNN + Fusion model.

    Combines:
      - GAT output   (graph relationship patterns)
      - CNN output   (temporal behaviour)
      - Current transaction features

    Through a fusion MLP to produce a fraud probability.
    """

    def __init__(
        self,
        gat_output_dim: int = GAT_OUTPUT_DIM,
        cnn_output_dim: int = GAT_OUTPUT_DIM,
        current_feature_dim: int = NUM_FEATURES,
        fusion_hidden: int = FUSION_HIDDEN_DIM,
    ) -> None:
        super().__init__()
        self.gat = GATComponent(output_dim=gat_output_dim)
        self.cnn = CNNComponent(output_dim=cnn_output_dim)

        concat_dim = gat_output_dim + cnn_output_dim + current_feature_dim

        self.fusion = nn.Sequential(
            nn.Linear(concat_dim, fusion_hidden),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(fusion_hidden, fusion_hidden // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(fusion_hidden // 2, 1),
        )

    def forward(
        self,
        graph_data: Dict[str, torch.Tensor],
        cnn_data: Dict[str, torch.Tensor],
        current_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        Parameters
        ----------
        graph_data : dict with x, edge_index, edge_attr
        cnn_data : dict with sequence, mask
        current_features : [NUM_FEATURES]

        Returns
        -------
        Fraud probability as a scalar tensor.
        """
        # GAT branch
        gat_out = self.gat(
            graph_data["x"],
            graph_data["edge_index"],
            graph_data["edge_attr"],
        )

        # CNN branch
        cnn_out = self.cnn(
            cnn_data["sequence"],
            cnn_data.get("mask"),
        )

        # Fuse
        combined = torch.cat([gat_out, cnn_out, current_features], dim=-1)
        logit = self.fusion(combined)
        return torch.sigmoid(logit).squeeze(-1)
