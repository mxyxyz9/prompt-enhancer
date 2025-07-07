chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhanceText') {
    chrome.storage.sync.get(['geminiApiKey', 'customPrompt'], async (data) => {
      const apiKey = data.geminiApiKey;
      const customPrompt = data.customPrompt || 'Rewrite the following text to be more concise and professional: ';

      if (!apiKey) {
        sendResponse({ error: 'API Key not set. Please configure it in the extension options.' });
        return true;
      }

      const textToEnhance = request.text;
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${customPrompt}${textToEnhance}`
              }]
            }]
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Gemini API error: ${response.status} - ${errorData.error.message}`);
        }

        const result = await response.json();
        const enhancedText = result.candidates[0].content.parts[0].text;
        sendResponse({ enhancedText: enhancedText });
      } catch (error) {
        console.error('Error enhancing text:', error);
        sendResponse({ error: `Failed to enhance text: ${error.message}` });
      }
    });
    return true; // Indicates that sendResponse will be called asynchronously
  }
});