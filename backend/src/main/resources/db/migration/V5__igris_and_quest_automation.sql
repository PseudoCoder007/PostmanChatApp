ALTER TABLE user_quests
    ADD COLUMN custom_title TEXT,
    ADD COLUMN custom_description TEXT,
    ADD COLUMN reward_xp_override INTEGER,
    ADD COLUMN reward_coins_override INTEGER,
    ADD COLUMN trigger_type TEXT,
    ADD COLUMN trigger_target TEXT,
    ADD COLUMN source TEXT NOT NULL DEFAULT 'template';
