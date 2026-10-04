"""Transaction history provider abstraction.

Separates the *source* of previous transactions from the model itself,
so MongoDB can replace the request-based provider later without any
changes to the inference pipeline.

Current sprint
──────────────
    Frontend → request body → RequestTransactionHistoryProvider → model

Future sprint
─────────────
    Frontend → current txn only → MongoTransactionHistoryProvider → model
"""

from __future__ import annotations

import abc
from typing import List

from app.transaction.schemas import TransactionData


class TransactionHistoryProvider(abc.ABC):
    """Abstract base for fetching a user's recent transactions."""

    @abc.abstractmethod
    def get_history(
        self,
        user_id: str | None = None,
        limit: int = 10,
    ) -> List[TransactionData]:
        """Return up to *limit* previous transactions for *user_id*.

        Returns the most recent transactions in chronological order
        (oldest first).
        """
        ...


class RequestTransactionHistoryProvider(TransactionHistoryProvider):
    """Provides history directly from the API request body.

    This is the provider for the current sprint.  The caller passes
    ``previous_transactions`` in the request, and this class simply
    returns them.
    """

    def __init__(self, transactions: List[TransactionData]) -> None:
        self._transactions = sorted(transactions, key=lambda t: t.timestamp)

    def get_history(
        self,
        user_id: str | None = None,
        limit: int = 10,
    ) -> List[TransactionData]:
        return self._transactions[:limit]


# ── Future placeholder ────────────────────────────────────────────────────────
# class MongoTransactionHistoryProvider(TransactionHistoryProvider):
#     """Fetches the latest N transactions from MongoDB.
#
#     Implementation deferred to the next sprint.
#     """
#
#     def __init__(self, db_client, collection_name: str = "transactions"):
#         self._collection = db_client[collection_name]
#
#     def get_history(self, user_id: str | None = None, limit: int = 10):
#         cursor = (
#             self._collection
#             .find({"user_id": user_id})
#             .sort("timestamp", -1)
#             .limit(limit)
#         )
#         docs = list(cursor)
#         docs.reverse()  # oldest first
#         return [TransactionData(**doc) for doc in docs]
