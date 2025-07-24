chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    chrome.storage.local.get("apiKey", ({ apiKey }) => {
      if (!apiKey) {
        sendResponse({ error: "API key not found." });
        return;
      }

      fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please rephrase the following short user text into a detailed and effective prompt for a Large Language Model.
					The goal is to make the prompt as clear and actionable as possible so that a user can paste it directly into a chat LLM and get a helpful answer to their question or problem.
					The rephrased prompt should be in the same language as the original text and should be significantly more detailed and user-ready than the original.

                    **Original User Text:**
                    "${request.text}"

                    **Example of Rephrasing (for input: 'fix my blurry photo'):**

                    "I have a photo that is blurry. What are some common reasons why photos become blurry?  And what are the best ways to try and fix a blurry photo? Please provide step-by-step instructions and suggest both software and online tools I could use.  Also, are there any limitations to fixing blurry photos?  For example, are some types of blurriness impossible to correct? **Respond in the same language as the original user request.**"


                    Now, rephrase the following Original User Text into a detailed and user-ready prompt that can be directly used in a chat LLM.  Remember to ONLY return the rephrased prompt, ready to be used. Do not include any extra text or explanations. Just provide the rephrased prompt itself.
                    `
                }
              ]
            }
          ]
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.candidates && data.candidates.length > 0) {
            sendResponse({ enhanced: data.candidates[0].content.parts[0].text.trim() });
          } else {
            sendResponse({ error: "No enhancement suggestions found." });
          }
        })
        .catch((error) => {
          sendResponse({ error: "Error calling the API." });
        });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});
