const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'doctor', 
  password: 'postgres',
  port: 5432,
});

const executeQuery = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query Error:', error);
    throw error;
  }
};

global.executeQuery = executeQuery;
global.db = pool;

module.exports = { executeQuery, pool };
