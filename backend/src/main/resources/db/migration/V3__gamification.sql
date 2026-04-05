ALTER TABLE profiles
    ADD COLUMN xp INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN coins INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN level INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN title TEXT NOT NULL DEFAULT 'Newbie';

CREATE TABLE quest_templates (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_xp INTEGER NOT NULL,
    reward_coins INTEGER NOT NULL,
    min_level INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_quests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES quest_templates (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('assigned', 'completed')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, template_id, status)
);

INSERT INTO quest_templates (id, code, title, description, reward_xp, reward_coins, min_level, active) VALUES
('11111111-1111-1111-1111-111111111111', 'compliment_friend', 'Compliment Run', 'Send a genuinely kind message to a friend today.', 20, 3, 1, TRUE),
('22222222-2222-2222-2222-222222222222', 'weird_fact', 'Weird Fact Drop', 'Start a chat with one strange but harmless fact.', 25, 4, 1, TRUE),
('33333333-3333-3333-3333-333333333333', 'group_starter', 'Room Starter', 'Post something fun in a group room and keep it alive.', 30, 5, 2, TRUE),
('44444444-4444-4444-4444-444444444444', 'movie_mode', 'Movie Mode', 'Talk using movie titles or dramatic lines for two messages.', 40, 6, 3, TRUE),
('55555555-5555-5555-5555-555555555555', 'challenge_friend', 'Challenge Friend', 'Create a fun challenge for a friend and tell them about it.', 50, 10, 5, TRUE);
