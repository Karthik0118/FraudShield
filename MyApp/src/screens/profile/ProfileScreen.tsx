/**
 * Profile Screen
 *
 * Displays user profile from GET /api/auth/profile.
 * Handles loading, error, retry states.
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ProfileStackParamList} from '../../navigation/AppNavigator';
import {useAuth} from '../../context/AuthContext';
import authApi from '../../api/authApi';
import UserAvatar from '../../components/UserAvatar';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import {User} from '../../types/auth';
import {extractApiError} from '../../utils/errorHandler';

const ProfileScreen: React.FC = () => {
  const {user, logout, updateStoredUser} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await authApi.getProfile();
      setProfile(response.data);
      await updateStoredUser(response.data);
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateStoredUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayProfile = profile || user;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }>
        {/* ─── Header ────────────────────────────────────────────── */}
        <Text style={styles.screenTitle}>Profile</Text>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage
            message={error}
            onRetry={() => fetchProfile()}
            onDismiss={() => setError('')}
          />
        ) : null}

        {/* ─── Avatar Section ────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <UserAvatar name={displayProfile?.name || 'User'} size={96} />
          <Text style={styles.profileName}>
            {displayProfile?.name || '—'}
          </Text>
          <Text style={styles.profileEmail}>
            {displayProfile?.email || '—'}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {displayProfile?.role?.toUpperCase() || 'USER'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                displayProfile?.isVerified
                  ? styles.statusBadgeVerified
                  : styles.statusBadgePending,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  displayProfile?.isVerified
                    ? styles.statusTextVerified
                    : styles.statusTextPending,
                ]}>
                {displayProfile?.isVerified ? '✓ Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Info Card ─────────────────────────────────────────── */}
        <View style={[styles.card]}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>
              {displayProfile?.name || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>
              {displayProfile?.email || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>
              {displayProfile?.phone || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {formatDate(displayProfile?.createdAt)}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {formatDate(displayProfile?.updatedAt)}
            </Text>
          </View>
        </View>

        {/* ─── Actions ───────────────────────────────────────────── */}
        <View style={styles.actionsSection}>
          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  screenTitle: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.sectionGap,
  },
  profileName: {
    ...Typography.styles.heading3,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  profileEmail: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  roleBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  roleBadgeText: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  statusBadgeVerified: {
    backgroundColor: Colors.successLight,
  },
  statusBadgePending: {
    backgroundColor: Colors.warningLight,
  },
  statusBadgeText: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
  },
  statusTextVerified: {
    color: Colors.success,
  },
  statusTextPending: {
    color: Colors.warning,
  },

  // Info Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    ...Shadows.sm,
    marginBottom: Spacing.sectionGap,
  },
  cardTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    flex: 1,
  },
  infoValue: {
    ...Typography.styles.captionMedium,
    color: Colors.textPrimary,
    flex: 1.5,
    textAlign: 'right',
  },

  // Actions
  actionsSection: {
    gap: Spacing.md,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default ProfileScreen;
