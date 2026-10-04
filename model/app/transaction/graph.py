"""Local transaction graph construction for the GAT component.

Since we do NOT have access to the global UPI network, the graph is
built from the user's local transaction data only.

Graph structure
───────────────
Nodes:
  - Node 0 = the current user (sender in every transaction)
  - Node 1..N = unique receivers encountered in previous + current transactions

Edges:
  For each transaction from the user to receiver R:
    - A directed edge  user → R  is created.
    - Edge features encode the transaction amount, time, and frequency.
  If the same receiver appears multiple times, edges are aggregated into
  a single edge with accumulated features (total amount, count, mean amount,
  time span).

This means for N unique receivers the graph has (N + 1) nodes and N edges.
Multi-edges are aggregated.

Node features
─────────────
  - Node 0 (user): aggregated statistics of all outgoing transactions.
  - Node i (receiver): aggregated statistics of transactions to that receiver.

Edge features
─────────────
  - total_amount:  sum of amounts on that edge
  - txn_count:     number of transactions on that edge
  - mean_amount:   average transaction amount
  - time_span_h:   hours between first and last transaction on that edge
  - recency_h:     hours since the most recent transaction on that edge
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

import torch

from app.transaction.schemas import TransactionData


# ── Constants ─────────────────────────────────────────────────────────────────
NODE_FEATURE_DIM = 5   # features per node
EDGE_FEATURE_DIM = 5   # features per edge


def _hours_between(a: datetime, b: datetime) -> float:
    return abs((b - a).total_seconds()) / 3600.0


def build_transaction_graph(
    current: TransactionData,
    previous: List[TransactionData],
    reference_time: datetime | None = None,
) -> Dict[str, torch.Tensor]:
    """Build a local transaction graph.

    Parameters
    ----------
    current : TransactionData
        The transaction being evaluated.
    previous : List[TransactionData]
        Historical transactions (up to 10).
    reference_time : datetime, optional
        Reference time for recency computation. Defaults to
        ``current.timestamp``.

    Returns
    -------
    dict with keys:
        ``x``           — node feature matrix  [num_nodes, NODE_FEATURE_DIM]
        ``edge_index``  — COO edge indices     [2, num_edges]
        ``edge_attr``   — edge feature matrix  [num_edges, EDGE_FEATURE_DIM]
        ``num_nodes``   — int
    """
    if reference_time is None:
        reference_time = current.timestamp

    all_txns = sorted(previous, key=lambda t: t.timestamp) + [current]

    # ── Assign node IDs ──────────────────────────────────────────────────────
    # Node 0 = user (sender), remaining nodes = unique receivers
    receiver_to_id: Dict[str, int] = {}
    next_id = 1
    for txn in all_txns:
        if txn.receiver_id not in receiver_to_id:
            receiver_to_id[txn.receiver_id] = next_id
            next_id += 1

    num_nodes = next_id  # 1 (user) + num_unique_receivers

    # ── Aggregate edges ──────────────────────────────────────────────────────
    # Key: receiver_node_id → list of (amount, timestamp)
    edge_data: Dict[int, List[Tuple[float, datetime]]] = defaultdict(list)
    for txn in all_txns:
        rid = receiver_to_id[txn.receiver_id]
        edge_data[rid].append((txn.amount, txn.timestamp))

    # ── Build tensors ────────────────────────────────────────────────────────
    src_list: List[int] = []
    dst_list: List[int] = []
    edge_features: List[List[float]] = []

    for recv_id, txns in edge_data.items():
        amounts = [a for a, _ in txns]
        times = [t for _, t in txns]
        total = sum(amounts)
        count = len(amounts)
        mean_amt = total / count
        time_span = _hours_between(min(times), max(times)) if count > 1 else 0.0
        recency = _hours_between(max(times), reference_time)

        src_list.append(0)        # user node
        dst_list.append(recv_id)  # receiver node

        edge_features.append([total, float(count), mean_amt, time_span, recency])

    # Handle the degenerate case: no edges at all (shouldn't happen since
    # current_transaction always creates at least one edge)
    if not src_list:
        edge_index = torch.zeros((2, 0), dtype=torch.long)
        edge_attr = torch.zeros((0, EDGE_FEATURE_DIM), dtype=torch.float32)
    else:
        edge_index = torch.tensor([src_list, dst_list], dtype=torch.long)
        edge_attr = torch.tensor(edge_features, dtype=torch.float32)

    # ── Node features ────────────────────────────────────────────────────────
    # Node 0 (user): [total_out, num_txns, mean_out, num_receivers, 0]
    all_amounts = [txn.amount for txn in all_txns]
    user_features = [
        sum(all_amounts),
        float(len(all_amounts)),
        sum(all_amounts) / len(all_amounts),
        float(len(receiver_to_id)),
        0.0,  # placeholder / padding
    ]

    node_features = [user_features]
    for recv_id in range(1, num_nodes):
        txns = edge_data.get(recv_id, [])
        if txns:
            r_amounts = [a for a, _ in txns]
            r_total = sum(r_amounts)
            r_count = len(r_amounts)
            r_mean = r_total / r_count
            r_recency = _hours_between(max(t for _, t in txns), reference_time)
            node_features.append([r_total, float(r_count), r_mean, r_recency, 0.0])
        else:
            node_features.append([0.0, 0.0, 0.0, 0.0, 0.0])

    x = torch.tensor(node_features, dtype=torch.float32)

    return {
        "x": x,
        "edge_index": edge_index,
        "edge_attr": edge_attr,
        "num_nodes": num_nodes,
    }
