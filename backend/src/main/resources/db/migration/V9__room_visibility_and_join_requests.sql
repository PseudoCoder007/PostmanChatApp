ALTER TABLE rooms
    ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public_room'
        CHECK (visibility IN ('public_room', 'private_room'));

CREATE TABLE room_join_requests (
    room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles (id) ON DELETE SET NULL,
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX idx_room_join_requests_room_status
    ON room_join_requests (room_id, status, created_at);
