CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type     TEXT NOT NULL CHECK (target_type IN ('message', 'user')),
    target_id       UUID NOT NULL,
    reason          TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')),
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status     ON reports(status, created_at DESC);
CREATE INDEX idx_reports_submitter  ON reports(submitter_id, created_at DESC);
