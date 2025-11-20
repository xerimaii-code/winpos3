
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_UI_RENDERING' });
};

export const generateSqlFromNaturalLanguage = async (
    prompt: string, 
    schemaContext?: string, 
    customKnowledge?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    if (ai.apiKey === 'DUMMY_KEY_FOR_UI_RENDERING') {
        return "-- API Key not configured. Please check Vercel Environment Variables.";
    }

    // 1. 대한민국 표준시(KST) 기준 날짜 계산
    const now = new Date();
    const kstOptions: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Seoul', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    const kstDateParts = new Intl.DateTimeFormat('en-CA', kstOptions).formatToParts(now);
    // en-CA format is usually YYYY-MM-DD, but let's be safe with parts
    const year = kstDateParts.find(p => p.type === 'year')?.value || '';
    const month = kstDateParts.find(p => p.type === 'month')?.value || '';
    const day = kstDateParts.find(p => p.type === 'day')?.value || '';

    const yymm = `${year.substring(2)}${month}`; // 2505
    const yyyymmdd = `${year}${month}${day}`;   // 20250520

    // 2. 시스템 컨텍스트 강화: 구체적인 테이블 이름 주입
    const dateContext = `[System Context - TIMEZONE: KST (Korea Standard Time)]
- Today's Date: ${yyyymmdd} (Format: YYYYMMDD)
- Current Month Suffix: ${yymm}
- **Real-time Sales Table for Today**: outd_${yymm} (Detail) OR outm_${yymm} (Master)
- **Instruction**: When asked for "Today", "Now", or "Real-time", YOU MUST USE 'outd_${yymm}' or 'outm_${yymm}'. DO NOT look for other tables.`;

    const schemaPart = schemaContext 
      ? `[Target Database Schema]\n${schemaContext}` 
      : `[Default Schema]\n(No schema loaded)`;

    const knowledgePart = customKnowledge
      ? `[Business Rules & Custom Knowledge]\n${customKnowledge}`
      : ``;

    const fullContext = `${dateContext}\n\n${schemaPart}\n\n${knowledgePart}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the natural language request into a Microsoft SQL Server (T-SQL) query.
      
      ${fullContext}
      
      Instructions:
      1. **Strictly** follow the table naming convention: outd_${yymm} for sales details.
      2. For "Today's Sales", use: SELECT ISNULL(SUM(money1vat1dc), 0) FROM outd_${yymm} WHERE day1 = '${yyyymmdd}' AND sale_status != '9'
      3. Do not use markdown formatting. Return only the SQL string.
      
      Request: ${prompt}`,
      config: {
        systemInstruction: "You are an expert SQL developer for Winpos3. You prioritize real-time data tables (outd_YYMM) over closed tables.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    let sql = response.text || "";
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
    return sql;
  } catch (error) {
    console.error("Gemini SQL Generation Error:", error);
    return "SELECT 'Error generating query' as Status";
  }
};

export const analyzeQueryResult = async (data: any[]): Promise<string> => {
  if (!data || data.length === 0) {
    return "조회된 데이터가 없습니다.";
  }

  try {
    const ai = getAiClient();
    if (ai.apiKey === 'DUMMY_KEY_FOR_UI_RENDERING') return "";

    const dataPreview = JSON.stringify(data.slice(0, 5)); 

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze this JSON data (SQL result) and provide a very short, friendly business insight in Korean.
        
        Data: ${dataPreview}
        `,
        config: {
            systemInstruction: "You are a friendly data analyst. Answer in Korean.",
            thinkingConfig: { thinkingBudget: 0 } 
        }
    });

    return response.text || "결과 분석 불가";
  } catch (error) {
    return "분석 중 오류 발생";
  }
};
