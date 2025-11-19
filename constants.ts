import { GuideStep } from './types';

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: "백엔드 서버 구축 (Backend Setup)",
    description: "브라우저는 보안상 데이터베이스(MS SQL)에 직접 TCP/IP 접속을 할 수 없습니다. 반드시 중간 다리 역할을 하는 백엔드 서버(API Server)가 필요합니다.",
    icon: "server",
    codeSnippet: `// Node.js Express 예시
const express = require('express');
const app = express();`
  },
  {
    id: 2,
    title: "DB 드라이버 설치 (Driver Installation)",
    description: "백엔드 서버 언어에 맞는 MS SQL 드라이버를 설치합니다. Node.js의 경우 'mssql', Python의 경우 'pyodbc' 등이 사용됩니다.",
    icon: "database",
    codeSnippet: `npm install mssql
# 또는
pip install pyodbc`
  },
  {
    id: 3,
    title: "API 엔드포인트 작성 (Create API)",
    description: "프론트엔드가 데이터를 요청할 수 있는 주소(URL)를 만듭니다. 이 곳에서 실제 DB 쿼리가 실행됩니다.",
    icon: "code",
    codeSnippet: `app.get('/api/users', async (req, res) => {
  const result = await sql.query('select * from users');
  res.json(result.recordset);
});`
  },
  {
    id: 4,
    title: "CORS 및 보안 설정 (Security)",
    description: "프론트엔드(React)와 백엔드의 도메인이 다를 경우 CORS 허용 설정이 필요하며, DB 접속 정보는 환경변수(.env)로 관리해야 합니다.",
    icon: "lock",
    codeSnippet: `const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: 'localhost', 
  database: 'MyDatabase'
};`
  },
  {
    id: 5,
    title: "프론트엔드 호출 (Fetch Data)",
    description: "React 앱에서 'fetch' 또는 'axios'를 사용하여 백엔드가 만들어둔 API 주소로 데이터를 요청합니다.",
    icon: "globe",
    codeSnippet: `// React Component
useEffect(() => {
  fetch('http://api-server.com/api/users')
    .then(res => res.json())
    .then(data => setUsers(data));
}, []);`
  },
  {
    id: 6,
    title: "Vercel 배포 (Deploy to Vercel)",
    description: "Vercel은 'Serverless Functions'를 제공합니다. 프로젝트의 'api' 폴더 내에 파일을 생성하면 자동으로 백엔드 엔드포인트가 되어 별도의 서버 설정 없이 배포됩니다.",
    icon: "rocket",
    codeSnippet: `// /api/users.js (Vercel Serverless Function)
import sql from 'mssql';

export default async function handler(req, res) {
  // Vercel 대시보드에서 환경변수(DB 접속정보) 설정 필수
  await sql.connect(process.env.DB_CONNECTION_STRING);
  const result = await sql.query('select * from users');
  res.status(200).json(result.recordset);
}`
  }
];

export const MOCK_USERS = [
  { id: 1, name: "김철수", email: "chulsoo@example.com", role: "Admin", lastLogin: "2023-10-25" },
  { id: 2, name: "이영희", email: "younghee@test.co.kr", role: "User", lastLogin: "2023-10-24" },
  { id: 3, name: "Park Ji-sung", email: "js.park@soccer.net", role: "User", lastLogin: "2023-10-20" },
  { id: 4, name: "Steve Jobs", email: "steve@apple.com", role: "Admin", lastLogin: "2011-10-05" },
  { id: 5, name: "Hong Gil-dong", email: "hong@joseon.kr", role: "Guest", lastLogin: "2023-01-01" },
];