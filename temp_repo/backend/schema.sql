CREATE TABLE IF NOT EXISTS runs (
    run_id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    skin_id TEXT NOT NULL,
    rules_version TEXT NOT NULL,
    height INTEGER NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    outcome TEXT NOT NULL,
    placement INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS runs_player ON runs(player_id, created_at);
CREATE INDEX IF NOT EXISTS runs_rules ON runs(rules_version);
