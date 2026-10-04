import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Typography, Spacing, Shadows} from '../../theme/theme';
import Icon from '../../components/Icon';
import {detectionApi, Detection} from '../../api/detectionApi';
import {useFocusEffect} from '@react-navigation/native';

const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SMS' | 'URL' | 'HIGH RISK' | 'SAFE'>('ALL');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await detectionApi.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.log('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all detection history? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await detectionApi.clearHistory();
              setHistory([]);
            } catch (err) {
              Alert.alert('Error', 'Failed to clear history');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'SMS') return item.type === 'SMS';
    if (filter === 'URL') return item.type === 'URL';
    if (filter === 'HIGH RISK') return item.riskLevel === 'HIGH_RISK';
    if (filter === 'SAFE') return item.riskLevel === 'SAFE';
    return true;
  });

  const renderItem = ({item}: {item: Detection}) => {
    const isHighRisk = item.riskLevel === 'HIGH_RISK';
    const isSafe = item.riskLevel === 'SAFE';

    let icon = 'Search';
    let color = Colors.primary;
    if (isHighRisk) {
      icon = 'AlertCircle';
      color = Colors.error;
    } else if (isSafe) {
      icon = 'ShieldCheck';
      color = Colors.success;
    } else {
      icon = 'AlertTriangle';
      color = Colors.warningDark;
    }

    return (
      <View style={[styles.card, Shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTypeBox}>
            <Icon name={item.type === 'SMS' ? 'MessageSquare' : 'Link'} size={14} color={Colors.textSecondary} />
            <Text style={styles.cardType}>{item.type}</Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Icon name={icon as any} size={24} color={color} style={{marginRight: 12}} />
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>{item.result || item.riskLevel}</Text>
            <Text style={styles.cardPreview} numberOfLines={2}>
              "{item.preview}"
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreText, {color}]}>{Math.round(item.riskScore)}%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detection History</Text>
        <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
          <Icon name="Trash2" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', 'SMS', 'URL', 'HIGH RISK', 'SAFE'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f as any)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.center}>
          <Icon name="Inbox" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No history found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// Add import ScrollView for filters
import {ScrollView} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.styles.heading2,
    color: Colors.textPrimary,
  },
  clearBtn: {
    padding: Spacing.sm,
  },
  filters: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.styles.bodyMedium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTypeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  cardType: {
    ...Typography.styles.small,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cardDate: {
    ...Typography.styles.small,
    color: Colors.textTertiary,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.styles.bodySemibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardPreview: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  scoreBox: {
    marginLeft: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    ...Typography.styles.heading3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.styles.body,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  }
});

export default HistoryScreen;
