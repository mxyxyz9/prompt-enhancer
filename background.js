chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    chrome.storage.local.get("apiKey", ({ apiKey }) => {
      if (!apiKey) {
        sendResponse({ error: "API key not found." });
        return;
      }

      fetch("https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT/locations/us-central1/publishers/google/models/chat-bison:generateMessage?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: { text: request.text },
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.candidates && data.candidates.length > 0) {
            sendResponse({ enhanced: data.candidates[0].output });
          } else {
            sendResponse({ error: "No enhancement suggestions found." });
          }
        })
        .catch((error) => {
          sendResponse({ error: "Error calling Gemini API." });
        });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});
