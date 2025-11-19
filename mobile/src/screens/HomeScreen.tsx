import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {loadStoredAuth} from '../store/slices/authSlice';

const {width, height} = Dimensions.get('window');

const HomeScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const dispatch = useDispatch();
  const {isAuthenticated, user} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth() as any);
  }, [dispatch]);

  return (
    <View style={styles.container}>
      {/* Jungle background decorations */}
      <View style={styles.decorationTop}>
        <Text style={styles.decorationEmoji}>🌴</Text>
        <Text style={styles.decorationEmoji}>🦜</Text>
        <Text style={styles.decorationEmoji}>🌴</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleEmoji}>🌿</Text>
          <Text style={styles.title}>JUNGLE</Text>
          <Text style={styles.titleEmoji}>🌿</Text>
        </View>
        <Text style={styles.subtitle}>RUN</Text>
        <Text style={styles.tagline}>
          {isAuthenticated ? `Welcome, ${user?.username}!` : 'Endless Adventure Awaits'}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => navigation.navigate('Game')}>
            <Text style={styles.playButtonText}>🏃 PLAY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.secondaryButtonText}>🏆 LEADERBOARD</Text>
          </TouchableOpacity>

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.secondaryButtonText}>👤 PROFILE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.secondaryButtonText}>🔑 LOGIN / REGISTER</Text>
            </TouchableOpacity>
          )}
        </View>

        {user && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{user.highScore}</Text>
              <Text style={styles.statLabel}>High Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💎</Text>
              <Text style={styles.statValue}>{user.totalCoins}</Text>
              <Text style={styles.statLabel}>Gems</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🎮</Text>
              <Text style={styles.statValue}>{user.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>
        )}

        {/* Power-ups info */}
        <View style={styles.powerUpsInfo}>
          <Text style={styles.powerUpsTitle}>Power-Ups</Text>
          <View style={styles.powerUpsList}>
            <Text style={styles.powerUpItem}>🧲 Magnet</Text>
            <Text style={styles.powerUpItem}>🛡️ Shield</Text>
            <Text style={styles.powerUpItem}>✨ 2X Coins</Text>
            <Text style={styles.powerUpItem}>⚡ Boost</Text>
          </View>
        </View>
      </View>

      {/* Bottom decoration */}
      <View style={styles.decorationBottom}>
        <Text style={styles.decorationEmoji}>🌳</Text>
        <Text style={styles.decorationEmoji}>🦎</Text>
        <Text style={styles.decorationEmoji}>🌳</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a', // Dark jungle green
  },
  decorationTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  decorationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  decorationEmoji: {
    fontSize: 40,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleEmoji: {
    fontSize: 30,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#88c999',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 40,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  playButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  playButtonText: {
    color: '#1a472a',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#88c999',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 10,
    color: '#88c999',
    marginTop: 3,
  },
  powerUpsInfo: {
    marginTop: 30,
    alignItems: 'center',
  },
  powerUpsTitle: {
    fontSize: 14,
    color: '#88c999',
    marginBottom: 8,
    fontWeight: '600',
  },
  powerUpsList: {
    flexDirection: 'row',
    gap: 15,
  },
  powerUpItem: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.7,
  },
});

export default HomeScreen;
