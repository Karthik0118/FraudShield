/**
 * Modern Edit Profile Screen
 *
 * Polished form for updating user profile info (name, phone).
 * Displays read-only email with security lock badge.
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

      Alert.alert('Success', 'Your profile has been updated successfully.', [
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
        {/* ─── Info Callout ──────────────────────────────────────── */}
        <View style={styles.infoCallout}>
          <Icon name="Info" size={18} color={Colors.infoDark} style={styles.calloutIcon} />
          <Text style={styles.calloutText}>
            You can update your display name and phone number. Your registered email address is protected and cannot be modified.
          </Text>
        </View>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        ) : null}

        {/* ─── Form Card ────────────────────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          {/* ─── Email (Read-Only) ─────────────────────────────────── */}
          <Input
            label="Email Address (Protected)"
            value={user?.email || ''}
            disabled
            leftIcon="Mail"
            placeholder=""
          />

          {/* ─── Name ──────────────────────────────────────────────── */}
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChangeText={text => {
              setName(text);
              setFieldErrors(prev => ({...prev, name: undefined}));
            }}
            error={fieldErrors.name}
            leftIcon="User"
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* ─── Phone ─────────────────────────────────────────────── */}
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={text => {
              setPhone(text);
              setFieldErrors(prev => ({...prev, phone: undefined}));
            }}
            error={fieldErrors.phone}
            leftIcon="Phone"
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {/* ─── Action Buttons ────────────────────────────────────── */}
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
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  calloutIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  calloutText: {
    ...Typography.styles.caption,
    color: Colors.infoDark,
    flex: 1,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});

export default EditProfileScreen;
