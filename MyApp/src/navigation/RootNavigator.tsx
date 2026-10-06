/**
 * Root Navigator
 *
 * Switches between AuthNavigator and AppNavigator based on auth state.
 * Shows a loading screen while the initial auth check is in progress.
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import {useAuth} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../components/LoadingScreen';
import {Colors} from '../theme/theme';

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          // @ts-ignore: backgroundColor is valid on Android but may be missing in types
          backgroundColor={Colors.background}
        />
        <LoadingScreen />
      </>
    );
  }

  const linking: any = {
    prefixes: ['fraudshield://'],
    config: {
      screens: {
        Detect: {
          screens: {
            DetectMain: 'realtime_result',
          },
        },
        Settings: {
          screens: {
            DeviceSecurity: 'device_security',
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <StatusBar
        barStyle="dark-content"
        // @ts-ignore: backgroundColor is valid on Android but may be missing in types
        backgroundColor={Colors.background}
      />
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
