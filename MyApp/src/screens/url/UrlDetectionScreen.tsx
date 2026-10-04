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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import Icon from '../../components/Icon';
import {urlApi} from '../../api/urlApi';
import {detectionApi} from '../../api/detectionApi';
import {extractApiError} from '../../utils/errorHandler';
import AiAnalysisCard from '../../components/AiAnalysisCard';

const UrlDetectionScreen: React.FC = () => {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<any>(null);
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
      setError('Please enter or paste a URL to analyse.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await urlApi.analyze({url: trimmed});
      setResult(response.data);
      animateResult();
      
      // Save to history
      try {
        await detectionApi.create({
          type: 'URL',
          input: trimmed,
          preview: trimmed.length > 50 ? trimmed.substring(0, 47) + '...' : trimmed,
          result: response.data.isMalicious ? 'Malicious' : (response.data.riskLevel === 'SUSPICIOUS' ? 'Suspicious' : 'Safe'),
          riskScore: response.data.riskScore,
          riskLevel: response.data.riskLevel,
          model: 'URL Risk Engine',
          detectedSignals: response.data.detectedSignals,
          reasons: response.data.reasons,
          recommendation: response.data.recommendation,
          scamType: response.data.isMalicious ? 'Phishing / Malicious Link' : 'Unknown',
        });
      } catch (histErr) {
        console.log("Failed to save history", histErr);
      }
      
    } catch (err: any) {
      const appError = extractApiError(err);
      setError(appError.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [text, animateResult]);

  const isFraud = result?.riskLevel === 'HIGH_RISK';
  const isSuspicious = result?.riskLevel === 'SUSPICIOUS';
  
  let bannerStyle = styles.verdictBannerLegit;
  let iconName: any = 'ShieldCheck';
  let iconColor = Colors.success;
  let verdictText = '🟢 SAFE';
  let verdictSub = 'This link does not show significant suspicious indicators.';
  
  if (isFraud) {
    bannerStyle = styles.verdictBannerFraud;
    iconName = 'AlertCircle';
    iconColor = Colors.error;
    verdictText = '🔴 HIGH RISK';
    verdictSub = 'This link contains multiple indicators associated with phishing or malicious activity.';
  } else if (isSuspicious) {
    bannerStyle = styles.verdictBannerSuspicious;
    iconName = 'AlertTriangle';
    iconColor = Colors.warningDark;
    verdictText = '🟠 SUSPICIOUS';
    verdictSub = 'This link contains indicators that require caution.';
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Icon name="Link" size={24} color={Colors.primary} strokeWidth={2.5} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>URL Security Scanner</Text>
          <Text style={styles.headerSubtitle}>
            Check links before you open them
          </Text>
        </View>
      </View>

      <View style={[styles.card, Shadows.card]}>
        <View style={styles.inputLabelRow}>
          <Icon name="Globe" size={16} color={Colors.textTertiary} style={{marginRight: 6}} />
          <Text style={styles.inputLabel}>Web URL</Text>
          {text.length > 0 && (
            <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
              <Icon name="X" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="Paste a URL here..."
          placeholderTextColor={Colors.placeholder}
          multiline={false}
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (error) setError(null);
            if (result) setResult(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity
        style={[styles.analyseBtn, (loading || !text.trim()) && styles.analyseBtnDisabled]}
        onPress={handleDetect}
        disabled={loading || !text.trim()}>
        {loading ? (
          <View style={styles.btnContent}>
            <ActivityIndicator size="small" color={Colors.white} />
            <Text style={styles.analyseBtnText}>Analysing...</Text>
          </View>
        ) : (
          <View style={styles.btnContent}>
            <Icon name="Search" size={18} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.analyseBtnText}>Analyse URL</Text>
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorCard}>
          <Icon name="AlertCircle" size={18} color={Colors.error} style={{marginRight: 8}} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <Animated.View style={{opacity: resultOpacity}}>
          <View style={[styles.verdictBanner, bannerStyle]}>
            <View style={styles.verdictIconBox}>
              <Icon name={iconName} size={28} color={iconColor} strokeWidth={2.5} />
            </View>
            <View style={styles.verdictTextBlock}>
              <Text style={[styles.verdictLabel, {color: iconColor}]}>{verdictText}</Text>
              <Text style={styles.verdictSub}>{verdictSub}</Text>
            </View>
          </View>

          <View style={[styles.card, Shadows.card]}>
            <Text style={styles.sectionTitle}>Analysis Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Risk Score:</Text>
              <Text style={[styles.detailValue, {color: iconColor}]}>{result.riskScore}%</Text>
            </View>
            
            {result.detectedSignals && result.detectedSignals.length > 0 && (
              <View style={styles.signalsContainer}>
                <Text style={styles.detailLabel}>Detected Signals:</Text>
                {result.detectedSignals.map((sig: string, idx: number) => (
                  <Text key={idx} style={styles.signalText}>• {sig}</Text>
                ))}
              </View>
            )}

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>Recommendation:</Text>
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>
          </View>
          
          <AiAnalysisCard detectionData={result} type="URL" />

        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
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
    ...Typography.styles.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
  },
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
  verdictBannerSuspicious: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
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
  verdictSub: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  detailValue: {
    ...Typography.styles.bodySemibold,
    fontSize: 16,
  },
  signalsContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  signalText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    marginBottom: 4,
  },
  recommendationBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Spacing.borderRadius.sm,
  },
  recommendationTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recommendationText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  }
});

export default UrlDetectionScreen;
