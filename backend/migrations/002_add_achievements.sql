-- Temple Run Database Schema
-- Migration 002: Achievements and Power-ups

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    requirement_type VARCHAR(50) NOT NULL, -- 'score', 'coins', 'distance', 'games_played'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Insert default achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value) VALUES
    ('First Steps', 'Complete your first game', 'games_played', 1),
    ('Coin Collector', 'Collect 100 coins', 'total_coins', 100),
    ('Marathon Runner', 'Travel 1000 meters', 'distance', 1000),
    ('High Scorer', 'Reach a score of 10,000', 'score', 10000),
    ('Veteran', 'Play 50 games', 'games_played', 50),
    ('Coin Master', 'Collect 1,000 coins', 'total_coins', 1000),
    ('Ultra Runner', 'Travel 10,000 meters', 'distance', 10000),
    ('Legend', 'Reach a score of 100,000', 'score', 100000);

COMMENT ON TABLE achievements IS 'Available achievements in the game';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have unlocked';
