import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: true,
    connectionTimeout: 10000, // 10초 연결 제한 (Vercel 함수 타임아웃 방지)
    requestTimeout: 10000     // 10초 쿼리 제한
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

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    await pool.close();
    
    res.status(200).json({ data: result.recordset });
    
  } catch (error) {
    console.error('Database Error Details:', error);
    // 연결 에러인지 쿼리 에러인지 구분하여 반환
    res.status(500).json({ 
      error: 'Database Error', 
      details: error.message, // 구체적인 에러 메시지 (Timeout 등)
      code: error.code
    });
  }
}