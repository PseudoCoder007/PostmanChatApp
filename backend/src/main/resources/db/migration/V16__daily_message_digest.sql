ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS last_message_digest_sent_at TIMESTAMPTZ;
