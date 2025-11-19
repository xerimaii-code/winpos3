import React, { useState } from 'react';
import { FileJson, Server, Terminal, CheckCircle2, Copy, AlertTriangle, Settings } from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ id, filename, code, language = 'javascript' }: { id: string, filename: string, code: string, language?: string }) => (
    <div className="mb-6 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
          {language === 'json' ? <FileJson className="w-4 h-4 text-yellow-400" /> : <Server className="w-4 h-4 text-blue-400" />}
          {filename}
        </span>
        <button
          onClick={() => handleCopy(id, code)}
          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          {copied === id ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied === id ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-blue-100/90 leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );

  const packageJsonCode = `{
  "name": "mssql-connect-guide",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0",
    "@google/genai": "^1.30.0",
    "mssql": "^10.0.1",
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1"
  }
}`;

  const vercelJsonCode = `{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}`;

  const apiCode = `// api/query.js
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE,
  options: {
    // Azure는 true, 사설 서버(iptime 등)는 false 권장
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    await pool.close();
    res.status(200).json({ data: result.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold text-white">Vercel 배포 체크리스트</h2>
        <p className="text-slate-400">
          빌드 오류를 방지하고 iptime 서버와 연결하기 위한 설정 파일들을 생성합니다.
        </p>
      </div>

      {/* Step 0: Database Setup */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white">1</div>
          <h3 className="text-xl font-semibold text-white">데이터베이스 정보 확인</h3>
        </div>
        
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 ml-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h4 className="text-slate-400 text-xs font-bold uppercase mb-3">타겟 서버 정보</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">HOST</span>
                    <code className="text-blue-400">kjmartII.iptime.org</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PORT</span>
                    <code className="text-blue-400">9876</code>
                  </div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg text-sm text-amber-200 leading-relaxed">
                 <AlertTriangle className="w-10 h-10 mr-3 text-amber-500 flex-shrink-0" />
                 <p>
                   Vercel 서버 IP는 수시로 바뀝니다. <br/>
                   공유기 및 방화벽에서 <strong>9876 포트에 대해 모든 IP 접속 허용</strong>이 되어 있어야 합니다.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Step 1: Create Files */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">2</div>
          <h3 className="text-xl font-semibold text-white">필수 파일 생성 및 수정</h3>
        </div>
        
        <div className="pl-4 border-l-2 border-slate-800 ml-4 space-y-6">
          <div>
            <p className="text-slate-300 mb-2 flex items-center gap-2">
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs font-bold">필수</span>
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-400 text-sm">package.json</code> 교체
              <span className="text-xs text-slate-500 ml-2">(tsc 제거 및 의존성 통합)</span>
            </p>
            <CodeBlock id="pkg" filename="package.json" code={packageJsonCode} language="json" />
          </div>

          <div>
            <p className="text-slate-300 mb-2 flex items-center gap-2">
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs font-bold">NEW</span>
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-sm">vercel.json</code> 생성
              <span className="text-xs text-slate-500 ml-2">(빌드 방식 강제 지정)</span>
            </p>
            <CodeBlock id="vercel" filename="vercel.json" code={vercelJsonCode} language="json" />
          </div>

          <div>
            <p className="text-slate-300 mb-2">
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 text-sm">api/query.js</code> 확인
            </p>
            <CodeBlock id="api" filename="api/query.js" code={apiCode} language="javascript" />
          </div>
        </div>
      </section>

      {/* Step 2: Environment Variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">3</div>
          <h3 className="text-xl font-semibold text-white">Vercel 환경변수 확인</h3>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 ml-4">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_SERVER</span>
                <span className="text-slate-500 text-xs">kjmartII.iptime.org</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300 text-yellow-400">DB_PORT</span>
                <span className="text-slate-500 text-xs">9876</span>
              </div>
               <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300 text-yellow-400">DB_ENCRYPT</span>
                <span className="text-slate-500 text-xs">false (사설 서버는 필수)</span>
              </div>
            </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4 mt-8">
         <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-red-400 font-bold flex items-center gap-2 mb-3">
               <AlertTriangle className="w-5 h-5" />
               빌드 에러가 계속 발생한다면? (Troubleshooting)
            </h3>
            <p className="text-slate-300 text-sm mb-4">
               'command not found' 에러는 주로 <code>package-lock.json</code>이 꼬여서 발생합니다.
               Vercel은 이 파일을 매우 엄격하게 따릅니다.
            </p>
            <div className="bg-black/50 p-4 rounded font-mono text-sm text-green-400 space-y-2">
               <p># 1. 로컬에서 lock 파일 삭제</p>
               <p className="text-slate-400">rm package-lock.json</p>
               <p># 2. 변경사항 커밋 및 푸시</p>
               <p className="text-slate-400">git add .</p>
               <p className="text-slate-400">git commit -m "Update build config & Remove lockfile"</p>
               <p className="text-slate-400">git push</p>
            </div>
         </div>
      </section>
    </div>
  );
};