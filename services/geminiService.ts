
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  // 브라우저(Vite) 환경에서 process.env 접근 시 크래시 방지
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  
  if (!apiKey) {
    console.warn("API Key is missing or not accessible in this environment.");
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

    // 동적 스키마(DB에서 긁어온 것)
    const schemaPart = schemaContext 
      ? `[Target Database Schema]\n${schemaContext}` 
      : `[Default Schema]\nTable 'Users': id, name, email...`;

    // 사용자 정의 지식(IndexedDB에서 불러온 것)
    const knowledgePart = customKnowledge
      ? `[Business Rules & Custom Knowledge]\n${customKnowledge}`
      : ``;

    const fullContext = `${schemaPart}\n\n${knowledgePart}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the following natural language request into a Microsoft SQL Server (T-SQL) query. 
      
      ${fullContext}
      
      Instructions:
      - Use the provided Schema and Business Rules strictly.
      - If specific codes (e.g., 'sale_status=9') are defined in Business Rules, apply them to filter data.
      - Only return the raw SQL string, no markdown formatting, no explanation.
      
      Request: ${prompt}`,
      config: {
        systemInstruction: "You are an expert SQL database administrator for Winpos3. Output only valid T-SQL.",
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
