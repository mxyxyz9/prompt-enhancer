chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    const envApiKey = process.env.API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';

    const handleEnhancement = async (apiKey) => {
      if (!apiKey) {
        sendResponse({ error: 'API key not configured' });
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getModel('gemini-2.0-flash-001');
        const result = await model.generateContent(`Enhance: "${request.prompt}"`);
        sendResponse({ enhancedPrompt: result.response.text() });
      } catch (error) {
        sendResponse({ error: `Enhancement failed: ${error.message}` });
      }
    };

    isDevelopment ? handleEnhancement(envApiKey) : 
      chrome.storage.sync.get('apiKey', ({ apiKey }) => handleEnhancement(apiKey));

    return true;
  }
});