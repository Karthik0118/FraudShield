import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon from './Icon';
import {aiApi} from '../api/aiApi';

interface Props {
  detectionData: any;
  type: 'SMS' | 'URL' | 'TRANSACTION';
}

const AiAnalysisCard: React.FC<Props> = ({detectionData, type}) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [chatMode, setChatMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{q: string; a: string}[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const res = await aiApi.explainResult({detectionData: {...detectionData, type}});
        if (isMounted) {
          setAnalysis(res.data);
        }
      } catch (err: any) {
        if (isMounted) setError("Unable to generate AI explanation.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [detectionData, type]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setAsking(true);
    
    // Simulate API call for chat (In real implementation, connect to aiController.askQuestion)
    try {
      // We will just do a placeholder response or use aiApi.explainResult if the backend doesn't have askQuestion yet.
      // Assuming backend_dev added `askQuestion` route. Let's try it using generic fetch to backend.
      const res = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          question: q,
          context: {...detectionData, type}
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, {q, a: data.data?.answer || "I'm sorry, I cannot answer that right now."}]);
    } catch (err) {
      setChatHistory(prev => [...prev, {q, a: "Failed to reach AI service. Please check your connection."}]);
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, Shadows.card, styles.center]}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Generating AI Security Analysis...</Text>
      </View>
    );
  }

  if (error || !analysis) {
    return null; // Fail gracefully
  }

  return (
    <View style={[styles.card, Shadows.card]}>
      <View style={styles.header}>
        <Icon name="Cpu" size={18} color={Colors.primary} />
        <Text style={styles.title}>AI Security Analysis</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WHY IS THIS SUSPICIOUS?</Text>
        <Text style={styles.text}>{analysis.why || analysis.explanation}</Text>
      </View>

      {analysis.scamType && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCAM TYPE</Text>
          <Text style={styles.textBadge}>{analysis.scamType}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WHAT SHOULD I DO?</Text>
        <Text style={styles.text}>{analysis.action || 'Stay cautious.'}</Text>
      </View>

      <View style={styles.divider} />
      
      <TouchableOpacity 
        style={styles.chatHeader}
        onPress={() => setChatMode(!chatMode)}>
        <Icon name="MessageSquare" size={16} color={Colors.primary} />
        <Text style={styles.chatTitle}>Ask FraudShield AI</Text>
        <Icon name={chatMode ? "ChevronRight" : "ChevronLeft"} size={16} color={Colors.textTertiary} style={{marginLeft: 'auto', transform: [{rotate: chatMode ? '90deg' : '-90deg'}]}} />
      </TouchableOpacity>

      {chatMode && (
        <View style={styles.chatContainer}>
          {chatHistory.map((item, idx) => (
            <View key={idx} style={styles.chatBubbleContainer}>
              <View style={styles.chatBubbleUser}>
                <Text style={styles.chatTextUser}>{item.q}</Text>
              </View>
              <View style={styles.chatBubbleAi}>
                <Text style={styles.chatTextAi}>{item.a}</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={handleAskQuestion}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!question.trim() || asking) && styles.sendBtnDisabled]}
              onPress={handleAskQuestion}
              disabled={!question.trim() || asking}>
              {asking ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Icon name="ArrowRight" size={16} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: Spacing.lg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.styles.bodySemibold,
    color: Colors.primary,
    marginLeft: 8,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.small,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  text: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  textBadge: {
    ...Typography.styles.bodyMedium,
    color: Colors.errorDark,
    backgroundColor: Colors.errorLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  chatTitle: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary,
    marginLeft: 8,
  },
  chatContainer: {
    marginTop: Spacing.sm,
  },
  chatBubbleContainer: {
    marginBottom: Spacing.md,
  },
  chatBubbleUser: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: 12,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 4,
  },
  chatTextUser: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
  },
  chatBubbleAi: {
    backgroundColor: Colors.primaryFaded,
    padding: Spacing.sm,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  chatTextAi: {
    ...Typography.styles.bodyMedium,
    color: Colors.primaryDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    ...Typography.styles.body,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.disabled,
  }
});

export default AiAnalysisCard;
