ALTER TABLE profiles
    ADD COLUMN username TEXT,
    ADD COLUMN last_active_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE profiles
SET username = 'user_' || substr(replace(id::text, '-', ''), 1, 8)
WHERE username IS NULL;

ALTER TABLE profiles
    ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX ux_profiles_username_lower ON profiles (LOWER(username));

CREATE TABLE friendships (
    user_low_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    user_high_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    PRIMARY KEY (user_low_id, user_high_id),
    CHECK (user_low_id <> user_high_id),
    CHECK (requested_by = user_low_id OR requested_by = user_high_id)
);

CREATE UNIQUE INDEX ux_rooms_group_name_lower
    ON rooms (LOWER(name))
    WHERE type = 'group';
