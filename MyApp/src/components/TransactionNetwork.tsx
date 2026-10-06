/**
 * Transaction Network Visualization
 *
 * Renders a local graph of the user's transaction relationships
 * using actual transaction data. No external graph API.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';
import {
  Transaction,
  TransactionPredictionRequest,
  TransactionPredictionResponse,
} from '../types/transaction';

interface Props {
  request: TransactionPredictionRequest;
  response: TransactionPredictionResponse;
}

interface ReceiverNode {
  id: string;
  totalAmount: number;
  count: number;
  isCurrent: boolean;
  types: string[];
}

const TransactionNetwork: React.FC<Props> = ({request, response}) => {
  const current = request.current_transaction;
  const previous = request.previous_transactions;

  // Build receiver nodes from actual data
  const receiverMap = new Map<string, ReceiverNode>();

  // Add previous transactions
  previous.forEach(t => {
    const existing = receiverMap.get(t.receiver_id);
    if (existing) {
      existing.totalAmount += t.amount;
      existing.count += 1;
      if (!existing.types.includes(t.transaction_type)) {
        existing.types.push(t.transaction_type);
      }
    } else {
      receiverMap.set(t.receiver_id, {
        id: t.receiver_id,
        totalAmount: t.amount,
        count: 1,
        isCurrent: false,
        types: [t.transaction_type],
      });
    }
  });

  // Add/update current transaction
  const existingCurrent = receiverMap.get(current.receiver_id);
  if (existingCurrent) {
    existingCurrent.totalAmount += current.amount;
    existingCurrent.count += 1;
    existingCurrent.isCurrent = true;
    if (!existingCurrent.types.includes(current.transaction_type)) {
      existingCurrent.types.push(current.transaction_type);
    }
  } else {
    receiverMap.set(current.receiver_id, {
      id: current.receiver_id,
      totalAmount: current.amount,
      count: 1,
      isCurrent: true,
      types: [current.transaction_type],
    });
  }

  const receivers = Array.from(receiverMap.values());
  const isFraud = response.is_fraud;

  if (receivers.length === 0) {
    return (
      <View style={[styles.container, Shadows.card]}>
        <View style={styles.header}>
          <Icon name="Target" size={18} color={Colors.primary} style={{marginRight: 6}} />
          <Text style={styles.title}>Transaction Network</Text>
        </View>
        <View style={styles.emptyState}>
          <Icon name="Info" size={24} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No transaction network available yet.</Text>
        </View>
      </View>
    );
  }

  const formatAmount = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <View style={[styles.container, Shadows.card]}>
      <View style={styles.header}>
        <Icon name="Target" size={18} color={Colors.primary} style={{marginRight: 6}} />
        <Text style={styles.title}>Transaction Network</Text>
      </View>

      {/* Central User Node */}
      <View style={styles.networkGraph}>
        <View style={styles.userNode}>
          <View style={styles.userNodeCircle}>
            <Icon name="User" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.userNodeLabel}>YOU</Text>
        </View>

        {/* Connection Lines + Receiver Nodes */}
        <View style={styles.receiverList}>
          {receivers.map((receiver) => {
            const isCurrentReceiver = receiver.isCurrent;
            const nodeColor =
              isCurrentReceiver && isFraud
                ? Colors.error
                : isCurrentReceiver && response.risk_level === 'MEDIUM'
                ? Colors.warning
                : Colors.success;
            const nodeBg =
              isCurrentReceiver && isFraud
                ? Colors.errorLight
                : isCurrentReceiver && response.risk_level === 'MEDIUM'
                ? Colors.warningLight
                : Colors.successLight;
            const nodeBorder =
              isCurrentReceiver && isFraud
                ? Colors.errorBorder
                : isCurrentReceiver && response.risk_level === 'MEDIUM'
                ? Colors.warningBorder
                : Colors.successBorder;

            return (
              <View key={receiver.id} style={styles.connectionRow}>
                {/* Arrow */}
                <View style={[styles.connectionLine, {backgroundColor: nodeColor}]} />
                <Icon name="ArrowRight" size={12} color={nodeColor} />

                {/* Receiver Node */}
                <View
                  style={[
                    styles.receiverNode,
                    {backgroundColor: nodeBg, borderColor: nodeBorder},
                  ]}>
                  <View style={styles.receiverTop}>
                    <Text
                      style={[styles.receiverName, {color: nodeColor}]}
                      numberOfLines={1}>
                      {receiver.id}
                    </Text>
                    {isCurrentReceiver && (
                      <View
                        style={[
                          styles.currentBadge,
                          {backgroundColor: nodeColor},
                        ]}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.receiverAmount}>
                    {formatAmount(receiver.totalAmount)}
                  </Text>
                  <View style={styles.receiverMeta}>
                    <Text style={styles.receiverMetaText}>
                      {receiver.count} txn{receiver.count > 1 ? 's' : ''} · {receiver.types.join(', ')}
                    </Text>
                    <Text style={{fontSize: 12}}>
                      {isCurrentReceiver && isFraud ? '🔴' : isCurrentReceiver && response.risk_level === 'MEDIUM' ? '🟠' : '🟢'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  networkGraph: {
    alignItems: 'center',
  },
  userNode: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userNodeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNodeLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  receiverList: {
    width: '100%',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  connectionLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginRight: 2,
  },
  receiverNode: {
    flex: 1,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
  },
  receiverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiverName: {
    ...Typography.styles.bodySemibold,
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.full,
    marginLeft: Spacing.sm,
  },
  currentBadgeText: {
    ...Typography.styles.small,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  receiverAmount: {
    ...Typography.styles.heading3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  receiverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiverMetaText: {
    ...Typography.styles.small,
    color: Colors.textSecondary,
  },
});

export default TransactionNetwork;
