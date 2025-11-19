import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10), // 포트 설정 추가
  database: process.env.DB_DATABASE,
  options: {
    // Azure SQL은 true가 필수지만, 로컬/iptime 서버는 인증서 문제로 false여야 할 수 있음
    // 환경변수 DB_ENCRYPT가 'true'일 때만 암호화 활성화 (기본값 false)
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: true, // 자체 서명 인증서 허용
  },
};

export default async function handler(req, res) {
  // 1. CORS 설정 (프론트엔드에서 호출 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. OPTIONS 요청 처리 (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // DB 연결 (Connection Pool 활용)
    // Vercel Serverless 환경에서는 전역 변수에 풀을 캐싱하는 패턴을 권장하지만,
    // 간단한 구현을 위해 매 요청마다 연결/해제를 수행합니다. (부하가 적을 때 유효)
    const pool = await sql.connect(config);
    
    // 쿼리 실행
    const result = await pool.request().query(query);
    
    // 연결 해제 (Serverless Function 종료 전 정리)
    await pool.close();
    
    // 결과 반환
    res.status(200).json({ data: result.recordset });
    
  } catch (error) {
    console.error('Database Error Details:', error);
    res.status(500).json({ 
      error: 'Database connection failed or query error', 
      details: error.message,
      code: error.code
    });
  }
}