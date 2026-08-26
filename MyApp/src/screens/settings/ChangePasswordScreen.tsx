/**
 * Modern Change Password Screen
 *
 * Polished security form with Lucide Lock/KeyRound icons,
 * real-time criteria checklist, and token rotation support.
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import authApi from '../../api/authApi';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Icon from '../../components/Icon';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import {validatePassword, validatePasswordMatch} from '../../utils/validation';
import {extractApiError} from '../../utils/errorHandler';

const ChangePasswordScreen: React.FC = () => {
  const {updateTokens} = useAuth();
  const navigation = useNavigation();

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => ({...prev, [field]: undefined}));
  };

  const validate = (): boolean => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      errors.newPassword = passwordResult.error;
      isValid = false;
    }

    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      errors.confirmPassword = matchResult.error;
      isValid = false;
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChangePassword = useCallback(async () => {
    setError('');
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      const {accessToken, refreshToken} = response.data;
      await updateTokens(accessToken, refreshToken);

      Alert.alert(
        'Password Updated',
        'Your security password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, updateTokens, navigation]);

  const isMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ─── Info Callout ──────────────────────────────────────── */}
        <View style={styles.securityHeader}>
          <View style={styles.securityIconBox}>
            <Icon name="KeyRound" size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.securityHeaderText}>
            <Text style={styles.securityTitle}>Update Security Credentials</Text>
            <Text style={styles.securitySubtitle}>
              Choose a strong password to safeguard your account.
            </Text>
          </View>
        </View>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : null}

        {/* ─── Form Card ────────────────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          {/* ─── Current Password ──────────────────────────────────── */}
          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={text => {
              setCurrentPassword(text);
              clearFieldError('currentPassword');
            }}
            error={fieldErrors.currentPassword}
            leftIcon="Lock"
            isPassword
            returnKeyType="next"
          />

          {/* ─── New Password ──────────────────────────────────────── */}
          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={text => {
              setNewPassword(text);
              clearFieldError('newPassword');
            }}
            error={fieldErrors.newPassword}
            leftIcon="Lock"
            isPassword
            returnKeyType="next"
          />

          {/* ─── Confirm New Password ──────────────────────────────── */}
          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              clearFieldError('confirmPassword');
            }}
            error={fieldErrors.confirmPassword}
            leftIcon="Lock"
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
          />

          {/* ─── Password Requirements Checklist ───────────────────── */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Security criteria</Text>

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
                  {passwordsMatch
                    ? 'New passwords match'
                    : 'New passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {/* ─── Submit Button ─────────────────────────────────────── */}
          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={loading}
            style={styles.submitButton}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            disabled={loading}
          />
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
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  securityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  securityHeaderText: {
    flex: 1,
  },
  securityTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
  },
  securitySubtitle: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
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
  submitButton: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});

export default ChangePasswordScreen;
