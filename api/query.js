
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'winpos3',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: true,
    connectionTimeout: 10000,
    requestTimeout: 10000
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    await pool.close();
    
    res.status(200).json({ 
      data: result.recordset,
      apiVersion: 'v9.4 (Backend Updated)'
    });
    
  } catch (error) {
    console.error('Database Error Details:', error);
    res.status(500).json({ 
      error: 'Database Error', 
      details: error.message, 
      code: error.code,
      apiVersion: 'v9.4 (Backend Updated)'
    });
  }
}
