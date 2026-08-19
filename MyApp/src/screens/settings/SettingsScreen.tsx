/**
 * Settings Screen
 *
 * Account settings, security options, about section, and logout.
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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../navigation/AppNavigator';
import {useAuth} from '../../context/AuthContext';
import Config from '../../config';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';

interface SettingsItem {
  id: string;
  emoji: string;
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SettingsScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
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

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          emoji: '👤',
          label: 'Edit Profile',
          description: 'Update your name and phone number',
          onPress: () => {
            navigation
              .getParent()
              ?.dispatch(CommonActions.navigate({name: 'Profile'}));
          },
        },
        {
          id: 'password',
          emoji: '🔒',
          label: 'Change Password',
          description: 'Update your account password',
          onPress: () => navigation.navigate('ChangePassword'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          emoji: 'ℹ️',
          label: 'App Version',
          description: Config.APP_VERSION,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'logout',
          emoji: '🚪',
          label: 'Sign Out',
          description: user?.email,
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingsItem,
                    index < section.items.length - 1 &&
                      styles.settingsItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.6}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemLabel,
                        item.danger && styles.itemLabelDanger,
                      ]}>
                      {item.label}
                    </Text>
                    {item.description ? (
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {item.id !== 'version' && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
  screenTitle: {
    ...Typography.styles.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.sectionGap,
  },
  sectionTitle: {
    ...Typography.styles.captionMedium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.cardPadding,
  },
  settingsItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: Spacing.lg,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    ...Typography.styles.bodyMedium,
    color: Colors.textPrimary,
  },
  itemLabelDanger: {
    color: Colors.error,
  },
  itemDescription: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xxs,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.medium,
  },
});

export default SettingsScreen;
