import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import {useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import SmsDetectionScreen from '../sms/SmsDetectionScreen';
import UrlDetectionScreen from '../url/UrlDetectionScreen';
import TransactionDetectionScreen from '../transaction/TransactionDetectionScreen';

type TabKey = 'SMS' | 'URL' | 'TXN';

const DetectScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, any>, string>>();
  const [activeTab, setActiveTab] = useState<TabKey>('SMS');
  const [txnInitialParams, setTxnInitialParams] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params && route.params.amount) {
        setActiveTab('TXN');
        setTxnInitialParams(route.params);
      }
    }, [route.params])
  );

  const tabs: {key: TabKey; label: string}[] = [
    {key: 'SMS', label: 'SMS'},
    {key: 'URL', label: 'URL'},
    {key: 'TXN', label: 'Transaction'},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'SMS' ? (
          <SmsDetectionScreen />
        ) : activeTab === 'URL' ? (
          <UrlDetectionScreen />
        ) : (
          <TransactionDetectionScreen initialParams={txnInitialParams} />
        )}
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
