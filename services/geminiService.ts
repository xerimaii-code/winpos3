import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSqlFromNaturalLanguage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    // Using gemini-2.5-flash for speed and good reasoning on code
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert the following natural language request into a Microsoft SQL Server (T-SQL) query. 
      The table name is 'Users'. Columns are: id (int), name (nvarchar), email (nvarchar), role (nvarchar), lastLogin (datetime).
      Only return the raw SQL string, no markdown formatting, no explanation.
      
      Request: ${prompt}`,
      config: {
        systemInstruction: "You are an expert SQL database administrator. Output only valid T-SQL.",
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for simple translation tasks to reduce latency
      }
    });

    let sql = response.text || "";
    // Cleanup potential markdown if model adds it despite instructions
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
    return sql;
  } catch (error) {
    console.error("Gemini SQL Generation Error:", error);
    return "SELECT * FROM Users -- Error generating specific query";
  }
};
