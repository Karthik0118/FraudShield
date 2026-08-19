/**
 * Home Screen
 *
 * Dashboard with personalized greeting, user info card,
 * quick actions, and placeholder for future modules.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';

interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  description: string;
  onPress: () => void;
}

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const navigation = useNavigation();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

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

  const quickActions: QuickAction[] = [
    {
      id: 'profile',
      emoji: '👤',
      label: 'My Profile',
      description: 'View and manage your profile',
      onPress: () => {
        navigation.dispatch(
          CommonActions.navigate({name: 'Profile'}),
        );
      },
    },
    {
      id: 'settings',
      emoji: '⚙️',
      label: 'Settings',
      description: 'App preferences and security',
      onPress: () => {
        navigation.dispatch(
          CommonActions.navigate({name: 'Settings'}),
        );
      },
    },
    {
      id: 'logout',
      emoji: '🚪',
      label: 'Sign Out',
      description: 'Log out of your account',
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ─── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.dispatch(CommonActions.navigate({name: 'Profile'}))
            }>
            <UserAvatar name={user?.name || 'User'} size={48} />
          </TouchableOpacity>
        </View>

        {/* ─── User Info Card ────────────────────────────────────── */}
        <View style={[styles.card, styles.userCard]}>
          <View style={styles.userCardHeader}>
            <Text style={styles.cardTitle}>Account Overview</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role?.toUpperCase() || 'USER'}
              </Text>
            </View>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Email</Text>
            <Text style={styles.userInfoValue}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Phone</Text>
            <Text style={styles.userInfoValue}>{user?.phone || '—'}</Text>
          </View>
          <View style={[styles.userInfoRow, styles.userInfoRowLast]}>
            <Text style={styles.userInfoLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  user?.isVerified
                    ? styles.statusDotVerified
                    : styles.statusDotPending,
                ]}
              />
              <Text style={styles.userInfoValue}>
                {user?.isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Actions ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.card, styles.actionCard]}
              onPress={action.onPress}
              activeOpacity={0.7}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDescription}>
                {action.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Future Modules Placeholder ────────────────────────── */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={[styles.card, styles.comingSoonCard]}>
          <Text style={styles.comingSoonEmoji}>🔍</Text>
          <Text style={styles.comingSoonTitle}>
            Fraud Detection Modules
          </Text>
          <Text style={styles.comingSoonText}>
            Transaction monitoring, anomaly detection, and reporting modules
            will be available here in upcoming updates.
          </Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
    marginTop: Spacing.xxs,
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.cardPadding,
    ...Shadows.sm,
    marginBottom: Spacing.lg,
  },

  // User Info Card
  userCard: {
    marginBottom: Spacing.sectionGap,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
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
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  userInfoRowLast: {
    borderBottomWidth: 0,
  },
  userInfoLabel: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
  },
  userInfoValue: {
    ...Typography.styles.captionMedium,
    color: Colors.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusDotVerified: {
    backgroundColor: Colors.success,
  },
  statusDotPending: {
    backgroundColor: Colors.warning,
  },

  // Quick Actions
  sectionTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sectionGap,
  },
  actionCard: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.styles.captionMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xxs,
  },
  actionDescription: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Coming Soon
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  comingSoonEmoji: {
    fontSize: 40,
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  comingSoonText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
});

export default HomeScreen;
