import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {logout} from '../store/slices/authSlice';

const ProfileScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout() as any);
    navigation.navigate('Home');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Not logged in</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>High Score</Text>
          <Text style={styles.statValue}>{user.highScore.toLocaleString()}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Coins</Text>
          <Text style={styles.statValue}>{user.totalCoins.toLocaleString()}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Games Played</Text>
          <Text style={styles.statValue}>{user.gamesPlayed}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Member Since</Text>
          <Text style={styles.statValue}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#2a2a2a',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  actionsSection: {
    padding: 20,
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ProfileScreen;
