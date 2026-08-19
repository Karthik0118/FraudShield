/**
 * App Navigator
 *
 * Bottom tab navigator for authenticated screens.
 * Each tab has its own nested stack for drill-down navigation.
 */

import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import {Colors, Typography, Spacing} from '../theme/theme';

// ─── Param Lists ────────────────────────────────────────────────────────────

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  ChangePassword: undefined;
};

// ─── Tab Icon Component ─────────────────────────────────────────────────────

interface TabIconProps {
  emoji: string;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({emoji, focused, label}) => (
  <View style={tabIconStyles.container}>
    <Text style={[tabIconStyles.emoji, focused && tabIconStyles.emojiFocused]}>
      {emoji}
    </Text>
  </View>
);

const tabIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  emojiFocused: {
    opacity: 1,
  },
});

// ─── Shared Stack Options ───────────────────────────────────────────────────

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: Colors.surface,
  },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: {
    ...Typography.styles.bodySemibold,
  },
  headerShadowVisible: false,
  contentStyle: {backgroundColor: Colors.background},
  animation: 'slide_from_right' as const,
};

// ─── Home Stack ─────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackScreen: React.FC = () => (
  <HomeStack.Navigator screenOptions={{headerShown: false, ...stackScreenOptions}}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
  </HomeStack.Navigator>
);

// ─── Profile Stack ──────────────────────────────────────────────────────────

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStackScreen: React.FC = () => (
  <ProfileStack.Navigator screenOptions={stackScreenOptions}>
    <ProfileStack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{headerShown: false}}
    />
    <ProfileStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{title: 'Edit Profile'}}
    />
  </ProfileStack.Navigator>
);

// ─── Settings Stack ─────────────────────────────────────────────────────────

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsStackScreen: React.FC = () => (
  <SettingsStack.Navigator screenOptions={stackScreenOptions}>
    <SettingsStack.Screen
      name="SettingsMain"
      component={SettingsScreen}
      options={{headerShown: false}}
    />
    <SettingsStack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{title: 'Change Password'}}
    />
  </SettingsStack.Navigator>
);

// ─── Bottom Tab Navigator ───────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="🏠" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="👤" focused={focused} label="Profile" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="⚙️" focused={focused} label="Settings" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    height: 60,
    elevation: 8,
  },
  tabBarLabel: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
});

export default AppNavigator;
