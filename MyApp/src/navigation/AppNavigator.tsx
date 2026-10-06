/**
 * App Navigator
 *
 * Polished Bottom Tab Navigator using Lucide icons.
 * Nested stack navigators for Home, Profile, and Settings.
 */

import React from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import DetectScreen from '../screens/detect/DetectScreen';
import RealTimeProtectionScreen from '../screens/realtime/RealTimeProtectionScreen';
import DeviceSecurityScreen from '../screens/settings/DeviceSecurityScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import {Colors, Typography, Spacing, Shadows} from '../theme/theme';
import Icon, {IconName} from '../components/Icon';

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
  RealTimeProtection: undefined;
  DeviceSecurity: undefined;
};

export type DetectStackParamList = {
  DetectMain: undefined;
};

export type HistoryStackParamList = {
  HistoryMain: undefined;
};

// ─── Tab Icon Component ─────────────────────────────────────────────────────

interface TabIconProps {
  name: IconName;
  focused: boolean;
}

const TabBarIcon: React.FC<TabIconProps> = ({name, focused}) => (
  <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
    <Icon
      name={name}
      size={22}
      color={focused ? Colors.primary : Colors.textTertiary}
      strokeWidth={focused ? 2.5 : 2}
    />
  </View>
);

// ─── Shared Stack Options ───────────────────────────────────────────────────

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: Colors.surface,
  },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
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
      options={{title: 'Edit Profile', headerBackTitle: 'Profile'}}
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
      options={{title: 'Change Password', headerBackTitle: 'Settings'}}
    />
    <SettingsStack.Screen
      name="RealTimeProtection"
      component={RealTimeProtectionScreen}
      options={{title: 'Real-Time Protection', headerBackTitle: 'Settings'}}
    />
    <SettingsStack.Screen
      name="DeviceSecurity"
      component={DeviceSecurityScreen}
      options={{title: 'Device Security', headerBackTitle: 'Settings'}}
    />
  </SettingsStack.Navigator>
);

// ─── Detect Stack ───────────────────────────────────────────────────────────

const DetectStack = createNativeStackNavigator<DetectStackParamList>();

const DetectStackScreen: React.FC = () => (
  <DetectStack.Navigator screenOptions={{headerShown: false, ...stackScreenOptions}}>
    <DetectStack.Screen name="DetectMain" component={DetectScreen} />
  </DetectStack.Navigator>
);

// ─── History Stack ──────────────────────────────────────────────────────────

const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

const HistoryStackScreen: React.FC = () => (
  <HistoryStack.Navigator screenOptions={{headerShown: false, ...stackScreenOptions}}>
    <HistoryStack.Screen name="HistoryMain" component={HistoryScreen} />
  </HistoryStack.Navigator>
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
          tabBarLabel: 'Home',
          tabBarIcon: ({focused}) => (
            <TabBarIcon name="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Detect"
        component={DetectStackScreen}
        options={{
          tabBarLabel: 'Detect',
          tabBarIcon: ({focused}) => (
            <TabBarIcon name="ScanLine" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({focused}) => (
            <TabBarIcon name="Clock" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({focused}) => (
            <TabBarIcon name="User" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({focused}) => (
            <TabBarIcon name="Settings" focused={focused} />
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
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
    height: Platform.OS === 'ios' ? 82 : 64,
    ...Shadows.md,
  },
  tabBarLabel: {
    ...Typography.styles.small,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperFocused: {
    backgroundColor: Colors.primaryFaded,
  },
});

export default AppNavigator;
