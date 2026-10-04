const fallbackExplanation = (detectionData) => {
  const isMalicious = detectionData.riskScore >= 70;
  return {
    why: isMalicious ? "The input contains several high-risk indicators common in scams." : "The input does not contain strong indicators of malicious activity.",
    scamType: isMalicious ? (detectionData.type === 'URL' ? 'Phishing URL' : 'Potential Scam') : 'None',
    action: isMalicious ? "Do not click links or share personal information." : "Proceed with standard caution.",
    explanation: `This is an automated fallback explanation. Based on the risk score of ${detectionData.riskScore}/100, this was classified as ${detectionData.riskLevel}.`
  };
};

const generateExplanation = async (detectionData) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.log("No AI_API_KEY provided. Using fallback explanation.");
    return fallbackExplanation(detectionData);
  }

  const prompt = `
Analyze the following fraud detection data and provide an explanation.
You MUST return ONLY a valid JSON object in the exact following format, with no markdown formatting or extra text:
{
  "why": "Brief 1-sentence reason why it is safe or dangerous",
  "scamType": "Specific type of scam if malicious, or 'None' if safe",
  "action": "1-sentence recommendation on what the user should do",
  "explanation": "A short paragraph explaining the risk signals in user-friendly terms"
}

Detection Data:
${JSON.stringify(detectionData, null, 2)}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.AI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return fallbackExplanation(detectionData);
  }
};

const askAIQuestion = async (question, context = "") => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return "AI service is currently unavailable. Please configure the AI API key.";
  }

  const prompt = `
Context about the fraud detection:
${JSON.stringify(context)}

User Question: ${question}

Provide a helpful, concise answer to the user's question regarding this fraud detection result.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.AI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("AI Question Error:", error);
    return "Sorry, I couldn't process your question at this time.";
  }
}

module.exports = { generateExplanation, askAIQuestion };
