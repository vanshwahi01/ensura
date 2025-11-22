import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'ensura',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
