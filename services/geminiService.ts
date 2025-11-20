import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  // 브라우저(Vite) 환경에서 process.env 접근 시 크래시 방지
  // 실제 배포 환경에서는 빌드 시점에 치환되거나 빈 객체로 처리됨
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  
  if (!apiKey) {
    // 개발 환경이거나 키가 없을 때 에러 대신 콘솔 경고 (화면 렌더링은 되도록)
    console.warn("API Key is missing or not accessible in this environment.");
    // 빈 키로 초기화하면 API 호출 시 에러가 나겠지만 앱 자체가 죽지는 않음
  }
  return new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_UI_RENDERING' });
};

export const generateSqlFromNaturalLanguage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // 키가 유효하지 않으면 미리 차단
    if (ai.apiKey === 'DUMMY_KEY_FOR_UI_RENDERING') {
        return "-- API Key not configured. Please check Vercel Environment Variables.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the following natural language request into a Microsoft SQL Server (T-SQL) query. 
      
      Database Schema Context:
      1. Table 'Users': id (int), name (nvarchar), email (nvarchar), role (nvarchar), lastLogin (datetime).
      2. Table 'outm_yymm' (POS Sales Master): 
         - sale_date (datetime): Transaction timestamp
         - tot_sale_amt (numeric): Total sales amount
         - bill_no (varchar): Receipt number
      
      Instructions:
      - If asked for "hourly sales" (시간대별 매출), extract the hour from 'sale_date' using DATEPART(HOUR, sale_date).
      - Only return the raw SQL string, no markdown formatting, no explanation.
      
      Request: ${prompt}`,
      config: {
        systemInstruction: "You are an expert SQL database administrator. Output only valid T-SQL.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    let sql = response.text || "";
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
    return sql;
  } catch (error) {
    console.error("Gemini SQL Generation Error:", error);
    return "SELECT * FROM outm_yymm -- Error: API Key invalid or Quota exceeded";
  }
};