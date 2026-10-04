import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import SmsDetectionScreen from '../sms/SmsDetectionScreen';
import UrlDetectionScreen from '../url/UrlDetectionScreen';

const DetectScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SMS' | 'URL'>('SMS');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'SMS' && styles.activeTab]}
            onPress={() => setActiveTab('SMS')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'SMS' && styles.activeTabText,
              ]}>
              SMS Scanner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'URL' && styles.activeTab]}
            onPress={() => setActiveTab('URL')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'URL' && styles.activeTabText,
              ]}>
              URL Scanner
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'SMS' ? <SmsDetectionScreen /> : <UrlDetectionScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Spacing.borderRadius.md,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: Shadows.sm,
      android: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 1.41
      } as any,
    }),
  },
  tabText: {
    ...Typography.styles.bodySemibold,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
});

export default DetectScreen;
