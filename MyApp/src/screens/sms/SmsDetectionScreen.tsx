/**
 * SMS Detection Screen
 *
 * Allows users to paste or type an SMS and get a real-time
 * BERT-based fraud analysis from the backend ML service.
 *
 * Result shows: Legitimate / Fraudulent badge, fraud probability
 * bar, confidence score, and example SMS buttons.
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
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import Icon from '../../components/Icon';
import smsApi from '../../api/smsApi';
import {SmsDetectData} from '../../types/sms';
import {extractApiError} from '../../utils/errorHandler';

// ─── Sample SMS Messages ──────────────────────────────────────────────────────
const SAMPLE_MESSAGES = [
  {
    label: 'Prize Scam',
    tag: 'fraud',
    text: "Congratulations! You've WON £1000 cash or a 4* holiday. To claim CALL 09050000327. Send STOP to 62220. Over 18s only. £3.50/call plus network charges.",
  },
  {
    label: 'Urgent Link',
    tag: 'fraud',
    text: 'URGENT: Your account has been compromised! Verify immediately at http://securebank-login.xyz/verify or your account will be suspended.',
  },
  {
    label: 'Normal SMS',
    tag: 'ham',
    text: 'Hey, are you free this evening? We are meeting at 7pm at the usual place. Let me know if you can make it!',
  },
  {
    label: 'OTP Message',
    tag: 'ham',
    text: 'Your OTP for login is 483921. It is valid for 10 minutes. Do not share this code with anyone.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const SmsDetectionScreen: React.FC = () => {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<SmsDetectData | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const resultOpacity             = useRef(new Animated.Value(0)).current;

  const animateResult = useCallback(() => {
    resultOpacity.setValue(0);
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [resultOpacity]);

  const handleDetect = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter or paste an SMS message to analyse.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await smsApi.detect({text: trimmed});
      setResult(response.data);
      animateResult();
    } catch (err: any) {
      const appError = extractApiError(err);
      const msg = appError.message;
      if (
        appError.statusCode === 503 ||
        msg.toLowerCase().includes('unavailable') ||
        msg.toLowerCase().includes('temporarily')
      ) {
        setError(
          'The fraud detection service is currently starting up or unavailable. Please ensure the ML service is running and try again.',
        );
      } else {
        setError(msg || 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [text, animateResult]);

  const handleClear = useCallback(() => {
    setText('');
    setResult(null);
    setError(null);
  }, []);

  const handleSample = useCallback((sampleText: string) => {
    setText(sampleText);
    setResult(null);
    setError(null);
  }, []);

  const isFraud    = result?.prediction === 'Fraudulent';
  const probPercent = result ? Math.round(result.fraud_probability * 100) : 0;
  const confPercent = result ? Math.round(result.confidence * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ─── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <Icon name="ScanLine" size={24} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>SMS Fraud Detector</Text>
            <Text style={styles.headerSubtitle}>
              Powered by fine-tuned BERT · Enter any SMS to analyse
            </Text>
          </View>
        </View>

        {/* ─── Text Input Card ─────────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.inputLabelRow}>
            <Icon
              name="MessageSquare"
              size={16}
              color={Colors.textTertiary}
              style={{marginRight: 6}}
            />
            <Text style={styles.inputLabel}>SMS Message</Text>
            {text.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name="X" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Paste or type an SMS here…"
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={text}
            onChangeText={t => {
              setText(t);
              if (error) setError(null);
              if (result) setResult(null);
            }}
            maxLength={2000}
            returnKeyType="done"
            blurOnSubmit
          />

          <View style={styles.charCountRow}>
            <Text style={styles.charCount}>{text.length} / 2000</Text>
          </View>
        </View>

        {/* ─── Sample Messages ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Try a sample:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.samplesRow}>
          {SAMPLE_MESSAGES.map(s => (
            <TouchableOpacity
              key={s.label}
              onPress={() => handleSample(s.text)}
              style={[
                styles.sampleChip,
                s.tag === 'fraud'
                  ? styles.sampleChipFraud
                  : styles.sampleChipHam,
              ]}>
              <Text
                style={[
                  styles.sampleChipText,
                  s.tag === 'fraud'
                    ? styles.sampleChipTextFraud
                    : styles.sampleChipTextHam,
                ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── Analyse Button ──────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.analyseBtn,
            (loading || text.trim().length === 0) && styles.analyseBtnDisabled,
          ]}
          onPress={handleDetect}
          disabled={loading || text.trim().length === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Analyse SMS">
          {loading ? (
            <View style={styles.btnContent}>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={styles.analyseBtnText}>Analysing…</Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Icon name="ScanLine" size={18} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.analyseBtnText}>Analyse SMS</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Error State ─────────────────────────────────────── */}
        {error && (
          <View style={styles.errorCard}>
            <Icon name="AlertCircle" size={18} color={Colors.error} style={{marginRight: 8}} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ─── Result Card ─────────────────────────────────────── */}
        {result && (
          <Animated.View style={{opacity: resultOpacity}}>
            {/* Verdict Banner */}
            <View
              style={[
                styles.verdictBanner,
                isFraud ? styles.verdictBannerFraud : styles.verdictBannerLegit,
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
                    isFraud ? styles.verdictLabelFraud : styles.verdictLabelLegit,
                  ]}>
                  {isFraud ? '🚨 FRAUDULENT' : '✅ LEGITIMATE'}
                </Text>
                <Text style={styles.verdictSub}>
                  {isFraud
                    ? 'This message appears to be a scam or fraud attempt.'
                    : 'This message appears to be safe and genuine.'}
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
                      isFraud ? styles.metricValueHigh : styles.metricValueLow,
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

              {/* Divider */}
              <View style={styles.divider} />

              {/* Confidence */}
              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricLabel}>Model Confidence</Text>
                  <Text style={[styles.metricValue, styles.metricValueNeutral]}>
                    {confPercent}%
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${confPercent}%` as any,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Detail Row */}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Result</Text>
                  <View
                    style={[
                      styles.detailBadge,
                      isFraud
                        ? styles.detailBadgeFraud
                        : styles.detailBadgeLegit,
                    ]}>
                    <Text
                      style={[
                        styles.detailBadgeText,
                        isFraud
                          ? styles.detailBadgeTextFraud
                          : styles.detailBadgeTextLegit,
                      ]}>
                      {result.prediction}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Model</Text>
                  <Text style={styles.detailValue}>DistilBERT</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Score</Text>
                  <Text style={styles.detailValue}>
                    {result.fraud_probability.toFixed(3)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerRow}>
              <Icon name="Info" size={13} color={Colors.textTertiary} style={{marginRight: 5}} />
              <Text style={styles.disclaimerText}>
                This analysis is AI-generated. Always use your judgement for
                important messages.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: Spacing.xxxl,
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

  // Input
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.styles.label,
    color: Colors.textPrimary,
    flex: 1,
  },
  clearBtn: {
    padding: 4,
  },
  textArea: {
    minHeight: 130,
    ...Typography.styles.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 22,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  charCount: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
  },

  // Samples
  sectionLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  samplesRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  sampleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1.5,
  },
  sampleChipFraud: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  sampleChipHam: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  sampleChipText: {
    ...Typography.styles.captionMedium,
    fontWeight: '600',
  },
  sampleChipTextFraud: {
    color: Colors.errorDark,
  },
  sampleChipTextHam: {
    color: Colors.successDark,
  },

  // Button
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

  // Verdict Banner
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
    fontSize: 16,
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
    marginBottom: Spacing.sm,
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
  metricValueNeutral: {
    color: Colors.primary,
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
  detailBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
  },
  detailBadgeFraud: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  detailBadgeLegit: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  detailBadgeText: {
    ...Typography.styles.small,
    fontWeight: '600',
  },
  detailBadgeTextFraud: {
    color: Colors.errorDark,
  },
  detailBadgeTextLegit: {
    color: Colors.successDark,
  },
  detailValue: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
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

export default SmsDetectionScreen;
