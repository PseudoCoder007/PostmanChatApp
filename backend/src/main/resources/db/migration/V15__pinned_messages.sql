CREATE TABLE pinned_messages (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, message_id)
);
CREATE INDEX idx_pinned_messages_room ON pinned_messages(room_id);
