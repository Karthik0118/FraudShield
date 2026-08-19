/**
 * Edit Profile Screen
 *
 * Consumes PUT /api/auth/profile.
 * Only name and phone are editable (email is read-only as per backend).
 * Pre-fills current values, validates, and refreshes profile on success.
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
import {validateName, validatePhone} from '../../utils/validation';
import {extractApiError} from '../../utils/errorHandler';

const EditProfileScreen: React.FC = () => {
  const {user, updateStoredUser} = useAuth();
  const navigation = useNavigation();

  // Pre-fill with current profile data
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const validate = (): boolean => {
    const errors: {name?: string; phone?: string} = {};
    let isValid = true;

    if (name.trim()) {
      const nameResult = validateName(name);
      if (!nameResult.isValid) {
        errors.name = nameResult.error;
        isValid = false;
      }
    }

    if (phone.trim()) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.isValid) {
        errors.phone = phoneResult.error;
        isValid = false;
      }
    }

    // At least one field should be changed
    if (name.trim() === user?.name && phone.trim() === user?.phone) {
      setError('No changes detected');
      return false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSave = useCallback(async () => {
    setError('');
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: {name?: string; phone?: string} = {};
      if (name.trim() !== user?.name) {
        updateData.name = name.trim();
      }
      if (phone.trim() !== user?.phone) {
        updateData.phone = phone.trim();
      }

      const response = await authApi.updateProfile(updateData);
      await updateStoredUser(response.data);

      Alert.alert('Success', 'Profile updated successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err) {
      const apiError = extractApiError(err);
      if (apiError.validationErrors) {
        const fieldMap: {name?: string; phone?: string} = {};
        apiError.validationErrors.forEach(ve => {
          if (ve.field === 'name' || ve.field === 'phone') {
            fieldMap[ve.field] = ve.message;
          }
        });
        setFieldErrors(prev => ({...prev, ...fieldMap}));
      }
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [name, phone, user, updateStoredUser, navigation]);

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
          Update your personal information. Only your name and phone number can
          be changed.
        </Text>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : null}

        {/* ─── Email (Read-Only) ─────────────────────────────────── */}
        <Input
          label="Email Address"
          value={user?.email || ''}
          disabled
          placeholder=""
        />

        {/* ─── Name ──────────────────────────────────────────────── */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={text => {
            setName(text);
            setFieldErrors(prev => ({...prev, name: undefined}));
          }}
          error={fieldErrors.name}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* ─── Phone ─────────────────────────────────────────────── */}
        <Input
          label="Phone Number"
          placeholder="+919876543210"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            setFieldErrors(prev => ({...prev, phone: undefined}));
          }}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* ─── Save Button ───────────────────────────────────────── */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
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
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
});

export default EditProfileScreen;
