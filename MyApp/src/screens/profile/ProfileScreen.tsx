/**
 * Modern Profile Screen
 *
 * Polished profile screen displaying verified user information,
 * Lucide item icons, pull-to-refresh, and quick actions.
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
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
import Icon from '../../components/Icon';
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
      month: 'short',
      day: 'numeric',
    });
  };

  // Initial loading state
  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile details...</Text>
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
        {/* ─── Screen Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Profile</Text>
        </View>

        {/* ─── Error Banner ──────────────────────────────────────── */}
        {error ? (
          <ErrorMessage
            message={error}
            onRetry={() => fetchProfile()}
            onDismiss={() => setError('')}
          />
        ) : null}

        {/* ─── Hero Avatar Card ──────────────────────────────────── */}
        <View style={[styles.avatarCard, Shadows.card]}>
          <UserAvatar
            name={displayProfile?.name || 'User'}
            size={84}
            showRing
          />
          <Text style={styles.profileName}>
            {displayProfile?.name || 'User'}
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
              <Icon
                name={displayProfile?.isVerified ? 'ShieldCheck' : 'Clock'}
                size={13}
                color={displayProfile?.isVerified ? Colors.successDark : Colors.warningDark}
                style={{marginRight: 4}}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  displayProfile?.isVerified
                    ? styles.statusTextVerified
                    : styles.statusTextPending,
                ]}>
                {displayProfile?.isVerified ? 'Verified Account' : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Account Information Card ──────────────────────────── */}
        <View style={[styles.card, Shadows.card]}>
          <Text style={styles.cardSectionTitle}>Account Details</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name="User" size={16} color={Colors.textTertiary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Full Name</Text>
            </View>
            <Text style={styles.infoValue}>
              {displayProfile?.name || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name="Mail" size={16} color={Colors.textTertiary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Email Address</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {displayProfile?.email || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name="Phone" size={16} color={Colors.textTertiary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Phone Number</Text>
            </View>
            <Text style={styles.infoValue}>
              {displayProfile?.phone || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name="Calendar" size={16} color={Colors.textTertiary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Member Since</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatDate(displayProfile?.createdAt)}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.infoLabelContainer}>
              <Icon name="Clock" size={16} color={Colors.textTertiary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Last Updated</Text>
            </View>
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
            leftIcon="Edit3"
          />
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            leftIcon="LogOut"
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
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
  },

  // Avatar Card
  avatarCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  profileName: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  profileEmail: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  roleBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  roleBadgeText: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Spacing.borderRadius.full,
  },
  statusBadgeVerified: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  statusBadgePending: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  statusBadgeText: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.semibold,
  },
  statusTextVerified: {
    color: Colors.successDark,
  },
  statusTextPending: {
    color: Colors.warningDark,
  },

  // Info Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  cardSectionTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoLabel: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },

  // Actions
  actionsSection: {
    gap: Spacing.md,
  },
});

export default ProfileScreen;
