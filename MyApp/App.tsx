/**
 * App Entry Point
 *
 * Minimal root: wraps the app in AuthProvider and SafeAreaProvider.
 * No business logic here — all routing handled by RootNavigator.
 */

import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
