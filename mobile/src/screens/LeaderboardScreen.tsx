import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {
  fetchGlobalLeaderboard,
  fetchFriendsLeaderboard,
} from '../store/slices/leaderboardSlice';
import {LeaderboardEntry} from '../types';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const {global, friends, loading} = useSelector(
    (state: RootState) => state.leaderboard,
  );
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    dispatch(fetchGlobalLeaderboard(100) as any);
  }, [dispatch]);

  const handleTabChange = (tab: 'global' | 'friends') => {
    setActiveTab(tab);
    if (tab === 'friends') {
      dispatch(fetchFriendsLeaderboard() as any);
    }
  };

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const getMedalEmoji = (rank: number) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `${rank}`;
    };

    return (
      <View style={styles.leaderboardItem}>
        <Text style={styles.rank}>{getMedalEmoji(item.rank)}</Text>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.score}>{item.score.toLocaleString()}</Text>
      </View>
    );
  };

  const data = activeTab === 'global' ? global : friends;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.activeTab]}
          onPress={() => handleTabChange('global')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'global' && styles.activeTabText,
            ]}>
            GLOBAL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => handleTabChange('friends')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText,
            ]}>
            FRIENDS
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderLeaderboardItem}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leaderboard data available</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFD700',
  },
  listContainer: {
    padding: 15,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    width: 50,
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});

export default LeaderboardScreen;
