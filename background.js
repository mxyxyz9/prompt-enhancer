import { GoogleGenAI } from '@google/genai';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    chrome.storage.sync.get('apiKey', async (data) => {
      const apiKey = data.apiKey;
      if (!apiKey) {
        sendResponse({ error: 'API key not set' });
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getModel('gemini-2.0-flash-001');
        const prompt = `Enhance this prompt for better AI response: "${request.prompt}"`;
        const result = await model.generateContent(prompt);
        const enhancedPrompt = result.response.text();
        sendResponse({ enhancedPrompt });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });
    return true;
  }
});