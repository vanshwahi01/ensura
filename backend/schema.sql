CREATE TABLE IF NOT EXISTS query_logs (
  id SERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
