import React, { useState } from 'react';
import { FileJson, Server, Terminal, CheckCircle2, Copy, AlertTriangle, ExternalLink, Database } from 'lucide-react';

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
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0",
    "@google/genai": "^1.30.0",
    "mssql": "^10.0.1",
    "vite": "^5.1.4",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18"
  }
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
          실제 MS SQL 서버를 준비하고 Vercel에 연결하는 전체 과정입니다.
        </p>
      </div>

      {/* Step 0: Database Setup */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white">1</div>
          <h3 className="text-xl font-semibold text-white">데이터베이스 준비</h3>
        </div>
        
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 ml-4">
          <div className="flex flex-col gap-4">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-amber-400">iptime 등 사설 서버 연결 시 주의사항:</strong><br/>
              외부 네트워크(Vercel)에서 공유기 내부의 DB로 접속하려면 <strong>포트포워딩</strong>이 필수입니다.
              또한 방화벽에서 해당 포트(예: 9876)의 인바운드 연결을 허용해야 합니다.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <h4 className="text-slate-400 text-xs font-bold uppercase mb-3">내 서버 정보 예시</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-slate-500 text-xs">Server (Host)</span>
                  <code className="text-blue-400">kjmartII.iptime.org</code>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs">Port</span>
                  <code className="text-blue-400">9876</code>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs">Database</span>
                  <code className="text-green-400">MyDatabase</code>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs">User / Password</span>
                  <code className="text-slate-400">(본인 설정 값)</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Create Files */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">2</div>
          <h3 className="text-xl font-semibold text-white">필수 파일 생성 (Create Files)</h3>
        </div>
        
        <div className="pl-4 border-l-2 border-slate-800 ml-4 space-y-6">
          <div>
            <p className="text-slate-300 mb-2">
              루트 경로의 <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-400 text-sm">package.json</code>을 아래 내용으로 교체합니다.
              <br/><span className="text-xs text-slate-500">(Vercel 빌드 오류 해결을 위해 모든 의존성을 dependencies로 이동했습니다)</span>
            </p>
            <CodeBlock id="pkg" filename="package.json" code={packageJsonCode} language="json" />
          </div>

          <div>
            <p className="text-slate-300 mb-2">
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 text-sm">api/query.js</code> 파일을 생성합니다.
              <br/><span className="text-xs text-slate-500">(포트 설정과 SSL 옵션이 추가되었습니다)</span>
            </p>
            <CodeBlock id="api" filename="api/query.js" code={apiCode} language="javascript" />
          </div>
        </div>
      </section>

      {/* Step 2: Environment Variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">3</div>
          <h3 className="text-xl font-semibold text-white">Vercel 환경변수 설정 (중요)</h3>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 ml-4">
          <div className="w-full">
            <h4 className="text-purple-200 font-medium mb-2">Vercel Settings {'>'} Environment Variables</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_SERVER</span>
                <span className="text-slate-500 text-xs">예: kjmartII.iptime.org</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300 text-yellow-400">DB_PORT</span>
                <span className="text-slate-500 text-xs">예: 9876</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_DATABASE</span>
                <span className="text-slate-500 text-xs">예: MyData</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_USER</span>
                <span className="text-slate-500 text-xs">사용자 ID</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_PASSWORD</span>
                <span className="text-slate-500 text-xs">******</span>
              </div>
               <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300 text-yellow-400">DB_ENCRYPT</span>
                <span className="text-slate-500 text-xs">false (Azure가 아니면 false 추천)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Git Push */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">4</div>
          <h3 className="text-xl font-semibold text-white">Git Push & Deploy</h3>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 ml-4 font-mono text-sm text-slate-300">
          <div className="space-y-2">
            <p><span className="text-green-400">$</span> git add .</p>
            <p><span className="text-green-400">$</span> git commit -m "Fix Vercel build & Add custom port"</p>
            <p><span className="text-green-400">$</span> git push</p>
          </div>
        </div>
      </section>
    </div>
  );
};