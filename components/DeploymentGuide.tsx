import React, { useState } from 'react';
import { FileJson, Server, Terminal, CheckCircle2, Copy, AlertTriangle, Settings, FileCode } from 'lucide-react';

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
          {language === 'json' ? <FileJson className="w-4 h-4 text-yellow-400" /> : <FileCode className="w-4 h-4 text-blue-400" />}
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
    "mssql": "^10.0.1"
  },
  "devDependencies": {
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
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const tsconfigCode = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["./**/*.ts", "./**/*.tsx"],
  "exclude": ["node_modules"]
}`;

  // api/query.js의 실제 내용과 동일하게 업데이트 (DB_NAME 반영)
  const apiCode = `// api/query.js
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  // 우선순위: DB_NAME(사용자 설정) > DB_DATABASE > 기본값(winpos3)
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'winpos3',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: true,
    connectionTimeout: 10000, // 10초 연결 제한
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
    
    // apiVersion 필드 추가 (배포 버전 확인용 v5.0)
    res.status(200).json({ 
      data: result.recordset,
      apiVersion: 'v5.0 (Backend Updated)'
    });
    
  } catch (error) {
    console.error('Database Error Details:', error);
    res.status(500).json({ 
      error: 'Database Error', 
      details: error.message, 
      code: error.code,
      apiVersion: 'v5.0 (Backend Updated)'
    });
  }
}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold text-white">Vercel 배포 최종 가이드</h2>
        <p className="text-slate-400">
          아래 4개 파일을 프로젝트에 생성하고, Vercel 환경변수를 설정하면 배포가 완료됩니다.
        </p>
      </div>

      {/* Step 0: Database Info */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white">1</div>
          <h3 className="text-xl font-semibold text-white">타겟 서버 정보 (kjmartII.iptime.org)</h3>
        </div>
        
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 ml-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h4 className="text-slate-400 text-xs font-bold uppercase mb-3">연결 정보 요약</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">HOST</span>
                    <code className="text-blue-400">kjmartII.iptime.org</code>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">PORT</span>
                    <code className="text-blue-400">9876</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DATABASE</span>
                    <code className="text-blue-400">winpos3</code>
                  </div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg text-sm text-amber-200 leading-relaxed">
                 <AlertTriangle className="w-10 h-10 mr-3 text-amber-500 flex-shrink-0" />
                 <p>
                   <strong>주의:</strong> Vercel 재배포 시 "Use existing build cache" 체크를 해제해야 수정 사항이 반영됩니다.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Step 1: Create Files */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">2</div>
          <h3 className="text-xl font-semibold text-white">필수 파일 생성 (복사 & 붙여넣기)</h3>
        </div>
        
        <div className="pl-4 border-l-2 border-slate-800 ml-4 space-y-6">
          <div>
            <p className="text-slate-300 mb-2 flex items-center gap-2">
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-xs font-bold">중요</span>
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-400 text-sm">package.json</code>
            </p>
            <CodeBlock id="pkg" filename="package.json" code={packageJsonCode} language="json" />
          </div>

          <div>
            <CodeBlock id="vercel" filename="vercel.json" code={vercelJsonCode} language="json" />
          </div>

          <div>
            <CodeBlock id="ts" filename="tsconfig.json" code={tsconfigCode} language="json" />
          </div>

          <div>
            <p className="text-slate-300 mb-2">
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 text-sm">api/query.js</code> (백엔드 로직)
            </p>
            <CodeBlock id="api" filename="api/query.js" code={apiCode} language="javascript" />
          </div>
        </div>
      </section>

      {/* Step 2: Environment Variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">3</div>
          <h3 className="text-xl font-semibold text-white">Vercel 환경변수 설정 (Settings > Environment Variables)</h3>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 ml-4">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-lg border border-slate-700">
                <div>
                  <span className="block font-mono text-blue-300 font-bold mb-1">DB_NAME</span>
                  <span className="text-slate-500 text-xs">사용할 데이터베이스 이름</span>
                </div>
                <code className="bg-slate-800 px-3 py-1 rounded text-green-400 border border-slate-600">winpos3</code>
              </div>

              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_SERVER</span>
                <code className="text-slate-400">kjmartII.iptime.org</code>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_PORT</span>
                <code className="text-slate-400">9876</code>
              </div>
               <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_ENCRYPT</span>
                <code className="text-slate-400">false</code>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <span className="font-mono text-slate-300">DB_USER / DB_PASSWORD</span>
                <span className="text-slate-500 text-xs">계정 정보 입력</span>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
};