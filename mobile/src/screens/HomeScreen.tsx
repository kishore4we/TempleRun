import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
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
      <ImageBackground
        source={{uri: 'https://placeholder.svg?height=800&width=400'}}
        style={styles.background}
        blurRadius={3}>
        <View style={styles.overlay}>
          <Text style={styles.title}>TEMPLE RUN</Text>
          <Text style={styles.subtitle}>
            {isAuthenticated ? `Welcome, ${user?.username}!` : 'Endless Adventure'}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => navigation.navigate('Game')}>
              <Text style={styles.playButtonText}>PLAY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={styles.secondaryButtonText}>LEADERBOARD</Text>
            </TouchableOpacity>

            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.secondaryButtonText}>PROFILE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Login')}>
                <Text style={styles.secondaryButtonText}>LOGIN / REGISTER</Text>
              </TouchableOpacity>
            )}
          </View>

          {user && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.highScore}</Text>
                <Text style={styles.statLabel}>High Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.totalCoins}</Text>
                <Text style={styles.statLabel}>Total Coins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.gamesPlayed}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  playButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playButtonText: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 50,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
  },
});

export default HomeScreen;
