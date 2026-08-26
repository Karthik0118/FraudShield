/**
 * Modern Register Screen
 *
 * Polished registration experience with Lucide input icons, real-time
 * password strength checklist, card-based layout, and validation.
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
    } catch (err: any) {
      const apiError = extractApiError(err);
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

  const isMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in">
            <Icon name="ChevronLeft" size={20} color={Colors.textSecondary} />
            <Text style={styles.backText}>Sign In</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>
            Join FraudShield to protect your transactions
          </Text>
        </View>

        {/* ─── Form Card ────────────────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          {/* ─── Error Banner ──────────────────────────────────── */}
          {error ? (
            <ErrorMessage message={error} onDismiss={() => setError('')} />
          ) : null}

          {/* ─── Form Fields ───────────────────────────────────── */}
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={text => {
              setName(text);
              clearFieldError('name');
            }}
            error={fieldErrors.name}
            leftIcon="User"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              clearFieldError('email');
            }}
            error={fieldErrors.email}
            leftIcon="Mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={text => {
              setPhone(text);
              clearFieldError('phone');
            }}
            error={fieldErrors.phone}
            leftIcon="Phone"
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Input
            label="Password"
            placeholder="Create password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearFieldError('password');
            }}
            error={fieldErrors.password}
            leftIcon="Lock"
            isPassword
            returnKeyType="next"
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              clearFieldError('confirmPassword');
            }}
            error={fieldErrors.confirmPassword}
            leftIcon="Lock"
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {/* ─── Password Checklist ─────────────────────────────── */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password criteria</Text>
            
            <View style={styles.requirementRow}>
              <Icon
                name={isMinLength ? 'CheckCircle2' : 'Clock'}
                size={14}
                color={isMinLength ? Colors.success : Colors.textTertiary}
                style={{marginRight: 6}}
              />
              <Text
                style={[
                  styles.requirementText,
                  isMinLength && styles.requirementMetText,
                ]}>
                At least 6 characters
              </Text>
            </View>

            <View style={styles.requirementRow}>
              <Icon
                name={hasNumber ? 'CheckCircle2' : 'Clock'}
                size={14}
                color={hasNumber ? Colors.success : Colors.textTertiary}
                style={{marginRight: 6}}
              />
              <Text
                style={[
                  styles.requirementText,
                  hasNumber && styles.requirementMetText,
                ]}>
                Contains at least one number
              </Text>
            </View>

            {confirmPassword.length > 0 && (
              <View style={styles.requirementRow}>
                <Icon
                  name={passwordsMatch ? 'CheckCircle2' : 'AlertCircle'}
                  size={14}
                  color={passwordsMatch ? Colors.success : Colors.error}
                  style={{marginRight: 6}}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordsMatch && styles.requirementMetText,
                    !passwordsMatch && styles.requirementFailText,
                  ]}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {/* ─── Register Button ───────────────────────────────── */}
          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            rightIcon="ArrowRight"
            style={styles.registerButton}
          />
        </View>

        {/* ─── Login Link ────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  heading: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  subheading: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  requirementsContainer: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  requirementsTitle: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  requirementText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
  },
  requirementMetText: {
    color: Colors.successDark,
    fontWeight: Typography.weights.medium,
  },
  requirementFailText: {
    color: Colors.errorDark,
    fontWeight: Typography.weights.medium,
  },
  registerButton: {
    marginTop: Spacing.xs,
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
