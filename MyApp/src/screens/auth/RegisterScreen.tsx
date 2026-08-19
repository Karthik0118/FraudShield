/**
 * Register Screen
 *
 * Full registration form with name, email, phone, password, confirm password.
 * Client-side validation matching backend rules.
 * Auto-login on successful registration (backend returns tokens).
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
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordMatch,
} from '../../utils/validation';
import {extractApiError} from '../../utils/errorHandler';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const {register} = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(prev => ({...prev, [field]: undefined}));
  };

  const handleRegister = async () => {
    setError('');

    // Validate all fields
    const errors: FieldErrors = {};
    let isValid = true;

    const nameResult = validateName(name);
    if (!nameResult.isValid) {
      errors.name = nameResult.error;
      isValid = false;
    }

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      errors.email = emailResult.error;
      isValid = false;
    }

    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) {
      errors.phone = phoneResult.error;
      isValid = false;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.error;
      isValid = false;
    }

    const matchResult = validatePasswordMatch(password, confirmPassword);
    if (!matchResult.isValid) {
      errors.confirmPassword = matchResult.error;
      isValid = false;
    }

    setFieldErrors(errors);
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password);
      // Auto-login: backend returns tokens on register.
      // Navigation happens automatically via RootNavigator.
    } catch (err: any) {
      const apiError = extractApiError(err);
      // If backend returns field-specific validation errors, map them
      if (apiError.validationErrors) {
        const fieldMap: FieldErrors = {};
        apiError.validationErrors.forEach(ve => {
          if (['name', 'email', 'phone', 'password'].includes(ve.field)) {
            (fieldMap as any)[ve.field] = ve.message;
          }
        });
        setFieldErrors(prev => ({...prev, ...fieldMap}));
      }
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
        {/* ─── Header ───────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>
            Join FraudShield to protect your transactions
          </Text>
        </View>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : null}

        {/* ─── Form ──────────────────────────────────────────────── */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={text => {
            setName(text);
            clearFieldError('name');
          }}
          error={fieldErrors.name}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={text => {
            setEmail(text);
            clearFieldError('email');
          }}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Input
          label="Phone Number"
          placeholder="+919876543210"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            clearFieldError('phone');
          }}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <Input
          label="Password"
          placeholder="Min 6 characters, include a number"
          value={password}
          onChangeText={text => {
            setPassword(text);
            clearFieldError('password');
          }}
          error={fieldErrors.password}
          isPassword
          returnKeyType="next"
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            clearFieldError('confirmPassword');
          }}
          error={fieldErrors.confirmPassword}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {/* ─── Password Requirements ─────────────────────────────── */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password requirements:</Text>
          <Text
            style={[
              styles.requirement,
              password.length >= 6 && styles.requirementMet,
            ]}>
            {password.length >= 6 ? '✓' : '○'} At least 6 characters
          </Text>
          <Text
            style={[
              styles.requirement,
              /\d/.test(password) && styles.requirementMet,
            ]}>
            {/\d/.test(password) ? '✓' : '○'} Contains at least one number
          </Text>
        </View>

        {/* ─── Register Button ───────────────────────────────────── */}
        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerButton}
        />

        {/* ─── Login Link ────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Text style={styles.linkText}>Sign In</Text>
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
    paddingTop: Spacing.xxxxl,
    paddingBottom: Spacing.xxxl,
  },
  headerSection: {
    marginBottom: Spacing.xxl,
  },
  heading: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  requirementsContainer: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.xxl,
  },
  requirementsTitle: {
    ...Typography.styles.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  requirement: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.xxs,
  },
  requirementMet: {
    color: Colors.success,
  },
  registerButton: {
    marginBottom: Spacing.xxl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
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

export default RegisterScreen;
