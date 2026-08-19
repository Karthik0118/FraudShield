/**
 * Change Password Screen
 *
 * Consumes POST /api/auth/change-password.
 * Fields: currentPassword, newPassword, confirmNewPassword.
 * On success: stores new token pair (backend returns rotated tokens).
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
import {Colors, Typography, Spacing} from '../../theme/theme';
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

      // Backend returns new token pair after password change
      const {accessToken, refreshToken} = response.data;
      await updateTokens(accessToken, refreshToken);

      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ─── Description ───────────────────────────────────────── */}
        <Text style={styles.description}>
          Choose a strong password that you don't use for other accounts. Your
          password must be at least 6 characters and contain at least one
          number.
        </Text>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : null}

        {/* ─── Current Password ──────────────────────────────────── */}
        <Input
          label="Current Password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChangeText={text => {
            setCurrentPassword(text);
            clearFieldError('currentPassword');
          }}
          error={fieldErrors.currentPassword}
          isPassword
          returnKeyType="next"
        />

        {/* ─── New Password ──────────────────────────────────────── */}
        <Input
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChangeText={text => {
            setNewPassword(text);
            clearFieldError('newPassword');
          }}
          error={fieldErrors.newPassword}
          isPassword
          returnKeyType="next"
        />

        {/* ─── Confirm New Password ──────────────────────────────── */}
        <Input
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            clearFieldError('confirmPassword');
          }}
          error={fieldErrors.confirmPassword}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleChangePassword}
        />

        {/* ─── Password Requirements ─────────────────────────────── */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password requirements:</Text>
          <Text
            style={[
              styles.requirement,
              newPassword.length >= 6 && styles.requirementMet,
            ]}>
            {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
          </Text>
          <Text
            style={[
              styles.requirement,
              /\d/.test(newPassword) && styles.requirementMet,
            ]}>
            {/\d/.test(newPassword) ? '✓' : '○'} Contains at least one number
          </Text>
          <Text
            style={[
              styles.requirement,
              confirmPassword.length > 0 &&
                newPassword === confirmPassword &&
                styles.requirementMet,
            ]}>
            {confirmPassword.length > 0 && newPassword === confirmPassword
              ? '✓'
              : '○'}{' '}
            Passwords match
          </Text>
        </View>

        {/* ─── Submit Button ─────────────────────────────────────── */}
        <Button
          title="Change Password"
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
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  description: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
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
  submitButton: {
    marginBottom: Spacing.md,
  },
});

export default ChangePasswordScreen;
