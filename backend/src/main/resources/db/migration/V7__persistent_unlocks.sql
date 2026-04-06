ALTER TABLE profiles
    ADD COLUMN profile_photo_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN friend_quests_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN igris_unlocked BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles
SET profile_photo_unlocked = TRUE
WHERE coins >= 5;

UPDATE profiles
SET igris_unlocked = TRUE
WHERE coins >= 5;

UPDATE profiles
SET friend_quests_unlocked = TRUE
WHERE coins >= 10;
