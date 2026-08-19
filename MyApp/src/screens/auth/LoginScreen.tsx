/**
 * Login Screen
 *
 * Modern, clean login with email/password, validation, loading state,
 * error handling, and register navigation.
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
import {Colors, Typography, Spacing} from '../../theme/theme';
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
      // Navigation happens automatically via RootNavigator
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
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🛡️</Text>
          </View>
          <Text style={styles.appName}>FraudShield</Text>
          <Text style={styles.subtitle}>
            Secure fraud detection at your fingertips
          </Text>
        </View>

        {/* ─── Welcome ──────────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Sign in to your account to continue
          </Text>

          {/* ─── Error Banner ──────────────────────────────────── */}
          {error ? (
            <ErrorMessage
              message={error}
              onDismiss={() => setError('')}
            />
          ) : null}

          {/* ─── Form ──────────────────────────────────────────── */}
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (fieldErrors.email) {
                setFieldErrors(prev => ({...prev, email: undefined}));
              }
            }}
            error={fieldErrors.email}
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
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* ─── Login Button ──────────────────────────────────── */}
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          {/* ─── Register Link ─────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: Spacing.mega,
    paddingBottom: Spacing.xxxl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    ...Typography.styles.heading2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
  },
  heading: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  loginButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
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
