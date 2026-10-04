"""CNN sequence construction for temporal transaction patterns.

Converts the user's chronologically ordered transaction history into a
fixed-size 2-D tensor suitable for 1-D convolution.

The CNN input is shaped as ``[1, MAX_SEQ_LEN, NUM_FEATURES]`` where:
  - MAX_SEQ_LEN = 10  (the maximum number of previous transactions)
  - NUM_FEATURES = 14  (from ``features.py``)

Padding & masking
─────────────────
If fewer than 10 previous transactions are available, the sequence is
**left-padded** with zeros so the most recent transactions sit at the
right end of the tensor. A boolean mask tensor indicates which positions
are real (True) vs. padded (False).

No fake transactions are ever generated.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

import torch

from app.transaction.config import MAX_PREVIOUS_TRANSACTIONS
from app.transaction.features import NUM_FEATURES, TransactionFeatures


def build_cnn_sequence(
    history_features: List[TransactionFeatures],
) -> Dict[str, torch.Tensor]:
    """Convert feature vectors into a padded CNN input tensor.

    Parameters
    ----------
    history_features:
        Feature vectors for previous transactions in chronological order.
        Length may be 0..10.

    Returns
    -------
    dict with keys:
        ``sequence``  — float tensor [MAX_SEQ_LEN, NUM_FEATURES]
        ``mask``      — bool tensor  [MAX_SEQ_LEN]
        ``length``    — int, actual number of real transactions
    """
    max_len = MAX_PREVIOUS_TRANSACTIONS

    # Convert to tensors
    if history_features:
        feat_tensors = [f.to_tensor() for f in history_features]
        real_seq = torch.stack(feat_tensors)  # [L, NUM_FEATURES]
    else:
        real_seq = torch.zeros((0, NUM_FEATURES), dtype=torch.float32)

    actual_len = real_seq.shape[0]

    # Left-pad to MAX_SEQ_LEN
    if actual_len < max_len:
        padding = torch.zeros((max_len - actual_len, NUM_FEATURES), dtype=torch.float32)
        sequence = torch.cat([padding, real_seq], dim=0)
    else:
        # Truncate to last max_len (shouldn't happen if input is validated)
        sequence = real_seq[-max_len:]
        actual_len = max_len

    # Mask: True for real positions, False for padding
    mask = torch.zeros(max_len, dtype=torch.bool)
    if actual_len > 0:
        mask[-actual_len:] = True

    return {
        "sequence": sequence,       # [MAX_SEQ_LEN, NUM_FEATURES]
        "mask": mask,               # [MAX_SEQ_LEN]
        "length": actual_len,
    }
