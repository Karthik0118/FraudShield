/**
 * Modern Login Screen
 *
 * Polished layout with Lucide Shield branding, Mail/Lock input icons,
 * inline validation, error handling, and register link.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/AuthNavigator';
import {useAuth} from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Icon from '../../components/Icon';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import {validateEmail} from '../../utils/validation';
import {extractApiError} from '../../utils/errorHandler';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const {login} = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleLogin = async () => {
    // Clear previous errors
    setError('');

    // Validate
    const errors: {email?: string; password?: string} = {};
    let isValid = true;

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      errors.email = emailResult.error;
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFieldErrors(errors);
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ─── Branding ─────────────────────────────────────────── */}
        <View style={styles.brandSection}>
          <View style={[styles.logoCircle, Shadows.sm]}>
            <Icon name="Shield" size={36} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>FraudShield</Text>
          <Text style={styles.subtitle}>
            Secure fraud detection & transaction monitoring
          </Text>
        </View>

        {/* ─── Form Card ────────────────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              Sign in to your account to continue
            </Text>
          </View>

          {/* ─── Error Banner ──────────────────────────────────── */}
          {error ? (
            <ErrorMessage
              message={error}
              onDismiss={() => setError('')}
            />
          ) : null}

          {/* ─── Form Inputs ───────────────────────────────────── */}
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (fieldErrors.email) {
                setFieldErrors(prev => ({...prev, email: undefined}));
              }
            }}
            error={fieldErrors.email}
            leftIcon="Mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (fieldErrors.password) {
                setFieldErrors(prev => ({...prev, password: undefined}));
              }
            }}
            error={fieldErrors.password}
            leftIcon="Lock"
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* ─── Login Button ──────────────────────────────────── */}
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            rightIcon="ArrowRight"
            style={styles.loginButton}
          />
        </View>

        {/* ─── Register Link ─────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.linkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  subtitle: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  heading: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  subheading: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  loginButton: {
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  linkText: {
    ...Typography.styles.bodySemibold,
    color: Colors.primary,
  },
});

export default LoginScreen;
