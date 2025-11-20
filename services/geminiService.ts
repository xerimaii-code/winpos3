
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

    // 현재 날짜 및 연월 계산 (YYYYMMDD, YYMM)
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const yymm = `${year.toString().substring(2)}${month}`;
    const yyyymmdd = `${year}${month}${day}`;

    const dateContext = `[System Context]
Current Date: ${yyyymmdd} (Format: YYYYMMDD)
Current Month Suffix: ${yymm} (Format: YYMM for table names like outm_${yymm})`;

    // 동적 스키마(DB에서 긁어온 것)
    const schemaPart = schemaContext 
      ? `[Target Database Schema]\n${schemaContext}` 
      : `[Default Schema]\nTable 'Users': id, name, email...`;

    // 사용자 정의 지식(IndexedDB에서 불러온 것)
    const knowledgePart = customKnowledge
      ? `[Business Rules & Custom Knowledge]\n${customKnowledge}`
      : ``;

    const fullContext = `${dateContext}\n\n${schemaPart}\n\n${knowledgePart}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the following natural language request into a Microsoft SQL Server (T-SQL) query. 
      
      ${fullContext}
      
      Instructions:
      - Use the provided Schema and Business Rules strictly.
      - If specific codes (e.g., 'sale_status=9') are defined in Business Rules, apply them to filter data.
      - Use the Current Month Suffix for table names (e.g., outm_${yymm}) unless a specific date is requested.
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

export const analyzeQueryResult = async (data: any[]): Promise<string> => {
  if (!data || data.length === 0) {
    return "실행 결과 데이터가 없습니다.";
  }

  try {
    const ai = getAiClient();
    if (ai.apiKey === 'DUMMY_KEY_FOR_UI_RENDERING') {
      return ""; // Don't show an error, just return empty.
    }
    const dataPreview = JSON.stringify(data.slice(0, 5)); // Send a preview to save tokens

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following JSON data which is a result of a SQL query. Provide a concise, one-sentence summary for a business user in Korean. Be friendly and direct.
        
        Example summaries:
        - "5월 총 매출은 1,234,567원입니다."
        - "재고가 10개 미만인 상품이 3개 있습니다."
        - "가장 많이 팔린 상품은 '신라면'입니다."

        Do not mention the JSON format. Do not explain the columns. Just provide the key insight.

        Data:
        ${dataPreview}
        `,
        config: {
            systemInstruction: "You are a helpful data analyst who provides quick insights in Korean.",
            thinkingConfig: { thinkingBudget: 0 } 
        }
    });

    return response.text || "결과를 분석하는 데 실패했습니다.";
  } catch (error) {
    console.error("Gemini Data Analysis Error:", error);
    return "결과를 분석하는 중 오류가 발생했습니다.";
  }
};
