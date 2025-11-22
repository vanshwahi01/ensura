import { query } from '../config/database';

export const saveQueryLog = async (chatId: string, queryText: string, response: string) => {
  const sql = 'INSERT INTO query_logs (chat_id, query, response) VALUES ($1, $2, $3) RETURNING *';
  const result = await query(sql, [chatId, queryText, response]);
  return result.rows[0];
};

export const getQueryLogsByChatId = async (chatId: string) => {
  const sql = 'SELECT * FROM query_logs WHERE chat_id = $1 ORDER BY created_at DESC';
  const result = await query(sql, [chatId]);
  return result.rows;
};

export const getAllQueryLogs = async () => {
  const sql = 'SELECT * FROM query_logs ORDER BY created_at DESC';
  const result = await query(sql);
  return result.rows;
};

export const getAllResponseContents = async () => {
  const sql = 'SELECT response FROM query_logs ORDER BY created_at DESC';
  const result = await query(sql);
  return result.rows.map(row => row.response);
};
