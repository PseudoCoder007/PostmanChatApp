ALTER TABLE user_quests
    ADD COLUMN assigned_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    ADD COLUMN challenge_note TEXT;

CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    message_id UUID REFERENCES messages (id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_room_id UUID REFERENCES rooms (id) ON DELETE CASCADE,
    related_message_id UUID REFERENCES messages (id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
