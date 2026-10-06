/**
 * Transaction Detection Screen
 *
 * Allows users to enter a transaction and get a real-time GCN-based
 * fraud analysis. Displays comprehensive results including:
 * - Risk status & classification
 * - Explain My Risk (local)
 * - Fraud Patterns (local)
 * - Security Score (local)
 * - Transaction Network (local)
 *
 * All post-prediction analysis is computed locally from actual data.
 */

import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import Icon from '../../components/Icon';
import transactionApi from '../../api/transactionApi';
import {detectionApi} from '../../api/detectionApi';
import {extractApiError} from '../../utils/errorHandler';
import {
  Transaction,
  TransactionType,
  TRANSACTION_TYPES,
  TransactionPredictionRequest,
  TransactionPredictionResponse,
} from '../../types/transaction';
import {generateRiskExplanation} from '../../utils/riskAnalysis';
import {detectFraudPatterns} from '../../utils/fraudPatternDetector';
import {calculateTransactionSecurityScore} from '../../utils/securityScore';
import RiskExplanationCard from '../../components/RiskExplanationCard';
import FraudPatternCard from '../../components/FraudPatternCard';
import SecurityScoreCard from '../../components/SecurityScoreCard';
import TransactionNetwork from '../../components/TransactionNetwork';
import RealTimeStatusBadge from '../../components/RealTimeStatusBadge';

// ─── Helper ─────────────────────────────────────────────────────────────────

const now = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const emptyTransaction = (): Transaction => ({
  amount: 0,
  receiver_id: '',
  timestamp: now(),
  transaction_type: 'UPI',
});

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  initialParams?: any;
}

const TransactionDetectionScreen: React.FC<Props> = ({ initialParams }) => {
  // ── Input State ─────────────────────────────────────────────────────────
  const [currentTxn, setCurrentTxn] = useState<Transaction>(emptyTransaction());
  const [previousTxns, setPreviousTxns] = useState<Transaction[]>([]);
  const [amountText, setAmountText] = useState('');

  // ── Analysis State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionPredictionResponse | null>(null);
  const [request, setRequest] = useState<TransactionPredictionRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultOpacity = useRef(new Animated.Value(0)).current;

  // ── Type Selector State ─────────────────────────────────────────────────
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const [sourceApp, setSourceApp] = useState('');

  React.useEffect(() => {
    if (initialParams && initialParams.amount) {
      const parsedAmount = typeof initialParams.amount === 'string' ? parseFloat(initialParams.amount) : initialParams.amount;
      const prob = typeof initialParams.fraud_probability === 'string' ? parseFloat(initialParams.fraud_probability) : initialParams.fraud_probability;
      
      const prefillTxn: Transaction = {
        amount: parsedAmount || 0,
        receiver_id: initialParams.receiver || 'unknown',
        timestamp: now(),
        transaction_type: 'UPI'
      };
      
      setCurrentTxn(prefillTxn);
      setAmountText(String(parsedAmount || ''));
      setIsRealtime(true);
      setSourceApp(initialParams.source_app || '');
      
      setRequest({
        current_transaction: prefillTxn,
        previous_transactions: []
      });
      
      setResult({
        fraud_probability: prob || 0,
        is_fraud: prob >= 0.5,
        risk_level: initialParams.risk_level || 'LOW',
        inference_time_ms: 0,
        model_version: 'GCN Real-Time'
      });
      
      // Auto-trigger animation
      setTimeout(animateResult, 100);
    }
  }, [initialParams]);

  const animateResult = useCallback(() => {
    resultOpacity.setValue(0);
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [resultOpacity]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!amountText || isNaN(Number(amountText)) || Number(amountText) <= 0) {
      return 'Please enter a valid positive amount.';
    }
    if (!currentTxn.receiver_id.trim()) {
      return 'Please enter a receiver ID.';
    }
    // Validate previous transactions
    for (let i = 0; i < previousTxns.length; i++) {
      const p = previousTxns[i];
      if (!p.amount || p.amount <= 0) {
        return `Previous transaction #${i + 1}: enter a valid amount.`;
      }
      if (!p.receiver_id.trim()) {
        return `Previous transaction #${i + 1}: enter a receiver ID.`;
      }
    }
    return null;
  };

  // ── Analyze ─────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: TransactionPredictionRequest = {
      current_transaction: {
        ...currentTxn,
        amount: Number(amountText),
      },
      previous_transactions: previousTxns,
    };

    setLoading(true);
    setResult(null);
    setRequest(null);
    setError(null);

    try {
      const response = await transactionApi.analyzeTransaction(payload);
      setResult(response);
      setRequest(payload);
      animateResult();

      // Save to detection history
      try {
        await detectionApi.create({
          type: 'TRANSACTION',
          input: JSON.stringify(payload.current_transaction),
          preview: `₹${Number(amountText).toLocaleString('en-IN')} → ${currentTxn.receiver_id}`,
          result: response.is_fraud ? 'Fraudulent' : 'Legitimate',
          riskScore: response.fraud_probability * 100,
          riskLevel:
            response.risk_level === 'HIGH'
              ? 'HIGH_RISK'
              : response.risk_level === 'MEDIUM'
              ? 'SUSPICIOUS'
              : 'SAFE',
          model: 'GCN Transaction',
          confidence: 1 - response.fraud_probability,
          detectedSignals: [],
          reasons: [],
          recommendation:
            response.is_fraud
              ? 'Review this transaction carefully before proceeding.'
              : 'Transaction appears safe.',
          scamType:
            response.is_fraud
              ? 'Suspicious Transaction'
              : 'None',
        });
      } catch (histErr) {
        console.log('Failed to save transaction history', histErr);
      }
    } catch (err: any) {
      const appError = extractApiError(err);
      const msg = appError.message;
      if (
        appError.statusCode === 503 ||
        msg.toLowerCase().includes('unavailable') ||
        msg.toLowerCase().includes('connect')
      ) {
        setError(
          'Unable to connect to the transaction analysis service. Please ensure the GCN model is running on port 8000.',
        );
      } else if (msg.toLowerCase().includes('timeout')) {
        setError('Analysis timed out. The model may be loading. Please try again.');
      } else {
        setError(msg || 'Transaction analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentTxn, previousTxns, amountText, animateResult]);

  // ── Previous Transaction Handlers ───────────────────────────────────────
  const addPreviousTxn = () => {
    setPreviousTxns(prev => [...prev, emptyTransaction()]);
  };

  const removePreviousTxn = (index: number) => {
    setPreviousTxns(prev => prev.filter((_, i) => i !== index));
  };

  const updatePreviousTxn = (
    index: number,
    field: keyof Transaction,
    value: any,
  ) => {
    setPreviousTxns(prev =>
      prev.map((t, i) => (i === index ? {...t, [field]: value} : t)),
    );
  };

  // ── Result derived data ─────────────────────────────────────────────────
  const isFraud = result?.is_fraud;
  const probPercent = result
    ? Math.round(result.fraud_probability * 100)
    : 0;

  const riskExplanation =
    request && result ? generateRiskExplanation(request, result) : null;
  const fraudPatterns =
    request && result ? detectFraudPatterns(request, result) : [];
  const securityScore = calculateTransactionSecurityScore(result);

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ─── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <Icon
              name="CreditCard"
              size={24}
              color={Colors.primary}
              strokeWidth={2.5}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Transaction Fraud Detector</Text>
            <Text style={styles.headerSubtitle}>
              Powered by GCN model · Analyse any transaction
            </Text>
          </View>
        </View>

        {/* ─── Current Transaction Card ────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <Icon
              name="CreditCard"
              size={16}
              color={Colors.textTertiary}
              style={{marginRight: 6}}
            />
            <Text style={styles.cardTitle}>Current Transaction</Text>
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[styles.textInput, styles.textInputWithPrefix]}
                placeholder="5,000"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                value={amountText}
                onChangeText={t => {
                  setAmountText(t.replace(/[^0-9.]/g, ''));
                  if (error) setError(null);
                  if (result) {
                    setResult(null);
                    setRequest(null);
                  }
                }}
              />
            </View>
          </View>

          {/* Receiver ID */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Receiver ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. user_123"
              placeholderTextColor={Colors.placeholder}
              value={currentTxn.receiver_id}
              onChangeText={t => {
                setCurrentTxn(prev => ({...prev, receiver_id: t}));
                if (error) setError(null);
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Transaction Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Transaction Type</Text>
            <View style={styles.typeSelector}>
              {TRANSACTION_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    currentTxn.transaction_type === type &&
                      styles.typeChipActive,
                  ]}
                  onPress={() =>
                    setCurrentTxn(prev => ({...prev, transaction_type: type}))
                  }>
                  <Text
                    style={[
                      styles.typeChipText,
                      currentTxn.transaction_type === type &&
                        styles.typeChipTextActive,
                    ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Timestamp */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date & Time</Text>
            <View style={styles.timestampRow}>
              <Icon
                name="Calendar"
                size={16}
                color={Colors.textTertiary}
                style={{marginRight: 8}}
              />
              <TextInput
                style={[styles.textInput, {flex: 1}]}
                placeholder="YYYY-MM-DDTHH:mm:ss"
                placeholderTextColor={Colors.placeholder}
                value={currentTxn.timestamp}
                onChangeText={t =>
                  setCurrentTxn(prev => ({...prev, timestamp: t}))
                }
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* ─── Previous Transactions Card ──────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <Icon
              name="Clock"
              size={16}
              color={Colors.textTertiary}
              style={{marginRight: 6}}
            />
            <Text style={styles.cardTitle}>Transaction History</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{previousTxns.length}</Text>
            </View>
          </View>

          {previousTxns.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Icon name="Inbox" size={24} color={Colors.textTertiary} />
              <Text style={styles.emptyHistoryText}>
                No previous transactions
              </Text>
              <Text style={styles.emptyHistorySubtext}>
                First-time transactions are supported
              </Text>
            </View>
          ) : (
            previousTxns.map((txn, idx) => (
              <View key={idx} style={styles.prevTxnCard}>
                <View style={styles.prevTxnHeader}>
                  <Text style={styles.prevTxnLabel}>
                    Transaction #{idx + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removePreviousTxn(idx)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon name="X" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.prevTxnRow}>
                  <View style={styles.prevTxnField}>
                    <Text style={styles.prevFieldLabel}>Amount (₹)</Text>
                    <TextInput
                      style={styles.prevInput}
                      placeholder="200"
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="numeric"
                      value={txn.amount ? String(txn.amount) : ''}
                      onChangeText={t =>
                        updatePreviousTxn(
                          idx,
                          'amount',
                          Number(t.replace(/[^0-9.]/g, '')) || 0,
                        )
                      }
                    />
                  </View>
                  <View style={styles.prevTxnField}>
                    <Text style={styles.prevFieldLabel}>Receiver</Text>
                    <TextInput
                      style={styles.prevInput}
                      placeholder="user_001"
                      placeholderTextColor={Colors.placeholder}
                      value={txn.receiver_id}
                      onChangeText={t =>
                        updatePreviousTxn(idx, 'receiver_id', t)
                      }
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.prevTxnRow}>
                  <View style={styles.prevTxnField}>
                    <Text style={styles.prevFieldLabel}>Type</Text>
                    <View style={styles.miniTypeSelector}>
                      {TRANSACTION_TYPES.map(type => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.miniTypeChip,
                            txn.transaction_type === type &&
                              styles.miniTypeChipActive,
                          ]}
                          onPress={() =>
                            updatePreviousTxn(idx, 'transaction_type', type)
                          }>
                          <Text
                            style={[
                              styles.miniTypeText,
                              txn.transaction_type === type &&
                                styles.miniTypeTextActive,
                            ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.prevTxnRow}>
                  <View style={styles.prevTxnField}>
                    <Text style={styles.prevFieldLabel}>Date & Time</Text>
                    <TextInput
                      style={styles.prevInput}
                      placeholder="YYYY-MM-DDTHH:mm:ss"
                      placeholderTextColor={Colors.placeholder}
                      value={txn.timestamp}
                      onChangeText={t =>
                        updatePreviousTxn(idx, 'timestamp', t)
                      }
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={addPreviousTxn}
            activeOpacity={0.7}>
            <Icon name="Plus" size={16} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Previous Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Analyse Button ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.analyseBtn,
            (loading || !amountText.trim()) && styles.analyseBtnDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={loading || !amountText.trim()}
          activeOpacity={0.8}>
          {loading ? (
            <View style={styles.btnContent}>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={styles.analyseBtnText}>Analysing transaction…</Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Icon
                name="Shield"
                size={18}
                color={Colors.white}
                strokeWidth={2.5}
              />
              <Text style={styles.analyseBtnText}>Analyse Transaction</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Error State ──────────────────────────────────────────── */}
        {error && (
          <View style={styles.errorCard}>
            <Icon
              name="AlertCircle"
              size={18}
              color={Colors.error}
              style={{marginRight: 8}}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ─── Result Section ───────────────────────────────────────── */}
        {result && request && (
          <Animated.View style={{opacity: resultOpacity}}>
            
            {isRealtime && (
              <View style={{ marginBottom: 12, alignItems: 'center' }}>
                <RealTimeStatusBadge sourceApp={sourceApp} isRealtime={isRealtime} />
              </View>
            )}

            {/* Verdict Banner */}
            <View
              style={[
                styles.verdictBanner,
                isFraud
                  ? styles.verdictBannerFraud
                  : styles.verdictBannerLegit,
              ]}>
              <View style={styles.verdictIconBox}>
                <Icon
                  name={isFraud ? 'AlertCircle' : 'ShieldCheck'}
                  size={28}
                  color={isFraud ? Colors.error : Colors.success}
                  strokeWidth={2.5}
                />
              </View>
              <View style={styles.verdictTextBlock}>
                <Text
                  style={[
                    styles.verdictLabel,
                    isFraud
                      ? styles.verdictLabelFraud
                      : styles.verdictLabelLegit,
                  ]}>
                  {isFraud
                    ? '🚨 POTENTIAL FRAUD DETECTED'
                    : '✅ TRANSACTION APPEARS LEGITIMATE'}
                </Text>
                <Text style={styles.verdictSub}>
                  {isFraud
                    ? 'This transaction exhibits characteristics associated with fraudulent activity.'
                    : 'This transaction appears consistent with normal activity patterns.'}
                </Text>
              </View>
            </View>

            {/* Metrics Card */}
            <View style={[styles.card, styles.metricsCard, Shadows.card]}>
              {/* Fraud Probability */}
              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricLabel}>Fraud Probability</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      isFraud
                        ? styles.metricValueHigh
                        : styles.metricValueLow,
                    ]}>
                    {probPercent}%
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${probPercent}%` as any,
                        backgroundColor: isFraud
                          ? Colors.error
                          : Colors.success,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Risk Level */}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Risk Level</Text>
                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor:
                          result.risk_level === 'HIGH'
                            ? Colors.errorLight
                            : result.risk_level === 'MEDIUM'
                            ? Colors.warningLight
                            : Colors.successLight,
                        borderColor:
                          result.risk_level === 'HIGH'
                            ? Colors.errorBorder
                            : result.risk_level === 'MEDIUM'
                            ? Colors.warningBorder
                            : Colors.successBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.riskBadgeText,
                        {
                          color:
                            result.risk_level === 'HIGH'
                              ? Colors.errorDark
                              : result.risk_level === 'MEDIUM'
                              ? Colors.warningDark
                              : Colors.successDark,
                        },
                      ]}>
                      {result.risk_level}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Prediction</Text>
                  <Text style={styles.detailValue}>
                    {result.is_fraud
                      ? 'Fraudulent'
                      : 'Legitimate'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Model</Text>
                  <Text style={styles.detailValue}>{result.model_version}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Transaction Details */}
              <Text style={styles.txnDetailsTitle}>Transaction Details</Text>
              <View style={styles.txnDetailRow}>
                <Text style={styles.txnDetailLabel}>Amount</Text>
                <Text style={styles.txnDetailValue}>
                  ₹{(request.current_transaction.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.txnDetailRow}>
                <Text style={styles.txnDetailLabel}>Receiver</Text>
                <Text style={styles.txnDetailValue}>
                  {request.current_transaction.receiver_id}
                </Text>
              </View>
              <View style={styles.txnDetailRow}>
                <Text style={styles.txnDetailLabel}>Type</Text>
                <Text style={styles.txnDetailValue}>
                  {request.current_transaction.transaction_type}
                </Text>
              </View>
              <View style={[styles.txnDetailRow, {borderBottomWidth: 0}]}>
                <Text style={styles.txnDetailLabel}>Timestamp</Text>
                <Text style={styles.txnDetailValue}>
                  {new Date(request.current_transaction.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* ─── Explain My Risk ─────────────────────────────────── */}
            {riskExplanation && (
              <RiskExplanationCard explanation={riskExplanation} />
            )}

            {/* ─── Fraud Patterns ──────────────────────────────────── */}
            <FraudPatternCard patterns={fraudPatterns} />

            {/* ─── Security Score ──────────────────────────────────── */}
            <SecurityScoreCard scoreData={securityScore} />

            {/* ─── Transaction Network ─────────────────────────────── */}
            <TransactionNetwork request={request} response={result} />

            {/* Disclaimer */}
            <View style={styles.disclaimerRow}>
              <Icon
                name="Info"
                size={13}
                color={Colors.textTertiary}
                style={{marginRight: 5}}
              />
              <Text style={styles.disclaimerText}>
                This analysis is AI-generated by a GCN model. Always use your
                judgement for financial decisions.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl + 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    flex: 1,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.styles.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs + 2,
  },
  textInput: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  currencyPrefix: {
    ...Typography.styles.heading3,
    color: Colors.textTertiary,
    paddingLeft: Spacing.md,
  },
  textInputWithPrefix: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },

  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  typeChipText: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: Colors.primary,
  },

  // Timestamp
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Previous Transactions
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyHistoryText: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyHistorySubtext: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Spacing.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    ...Typography.styles.small,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  prevTxnCard: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  prevTxnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  prevTxnLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  prevTxnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  prevTxnField: {
    flex: 1,
  },
  prevFieldLabel: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  prevInput: {
    ...Typography.styles.caption,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontSize: 13,
  },
  miniTypeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  miniTypeChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.xs,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniTypeChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  miniTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  miniTypeTextActive: {
    color: Colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryFaded,
    gap: Spacing.sm,
  },
  addButtonText: {
    ...Typography.styles.captionMedium,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Analyse Button
  analyseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  analyseBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analyseBtnText: {
    ...Typography.styles.button,
    color: Colors.white,
    marginLeft: 8,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.errorDark,
    flex: 1,
    lineHeight: 20,
  },

  // Verdict
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  verdictBannerFraud: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  verdictBannerLegit: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  verdictIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  verdictTextBlock: {
    flex: 1,
  },
  verdictLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  verdictLabelFraud: {
    color: Colors.errorDark,
  },
  verdictLabelLegit: {
    color: Colors.successDark,
  },
  verdictSub: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Metrics
  metricsCard: {
    marginBottom: Spacing.lg,
  },
  metricRow: {
    marginBottom: Spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
  },
  metricValue: {
    ...Typography.styles.bodySemibold,
    fontSize: 15,
  },
  metricValueHigh: {
    color: Colors.error,
  },
  metricValueLow: {
    color: Colors.success,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
  },
  riskBadgeText: {
    ...Typography.styles.small,
    fontWeight: '700',
  },

  // Transaction Details
  txnDetailsTitle: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  txnDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  txnDetailLabel: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
  },
  txnDetailValue: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
  },

  // Disclaimer
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    flex: 1,
    lineHeight: 18,
  },
});

export default TransactionDetectionScreen;
