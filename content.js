function addEnhanceButton() {
    let textareas;

    // Check if we are on ChatGPT
    if (window.location.hostname.includes('chatgpt') || window.location.hostname.includes('openai.com')) {
        // Target the ChatGPT textarea
        textareas = document.querySelectorAll('div[contenteditable="true"]');
    } else {
        textareas = document.querySelectorAll('textarea, div[contenteditable="true"]');
    }

    for (let textarea of textareas) {
        if (!textarea.dataset.enhanceButtonAdded) {
            const button = document.createElement('button');
            button.className = 'enhance-button';
            button.style.margin = '5px';
            button.style.display = 'flex';
            button.style.justifyContent = 'center';
            button.style.alignItems = 'center';
            button.textContent = 'Enhance prompt';

            textarea.addEventListener('input', function(event) {
                const text = textarea.textContent || textarea.value;
                if (text) {
                    const firstChar = text.charAt(0);
                    if (/[\u0600-\u06FF]/.test(firstChar)) {
                        textarea.setAttribute("dir", "rtl");
                        textarea.style.textAlign = "right";
                        textarea.style.fontFamily = 'Vazirmatn, sans-serif';
                    } else if (/[A-Za-z]/.test(firstChar)) {
                        textarea.setAttribute("dir", "ltr");
                        textarea.style.textAlign = "left";
                        textarea.style.fontFamily = ''; // Reset font if needed
                    }
                } else {
                    textarea.setAttribute("dir", "ltr"); // Default to LTR when empty
                    textarea.style.textAlign = "left";
                }
            });

            button.onclick = async () => {
                const originalText = textarea.textContent || textarea.value; // Handle both textarea and contenteditable div
                if (originalText.trim()) {
                    try {
                        button.textContent = '✨ Enhancing...';
                        button.disabled = true;

                        chrome.storage.local.get(['geminiApiKey'], async function(result) {
                            const apiKey = result.geminiApiKey;
                            if (!apiKey) {
                                alert('Gemini API Key is not set. Please open the extension popup and set your Gemini API Key.');
                                button.textContent = 'Enhance prompt';
                                button.disabled = false;
                                return;
                            }
                            try {
                                const enhancedText = await enhanceText(originalText, apiKey);
                                // Handle setting value for both textarea and contenteditable div
                                if (textarea.tagName === 'TEXTAREA') {
                                    textarea.value = enhancedText;
                                } else {
                                    textarea.textContent = enhancedText;
                                }


                                // --- Dispatch an 'input' event ---
                                textarea.dispatchEvent(new InputEvent('input', {
                                    bubbles: true,
                                    cancelable: true,
                                }));
                                // ----------------------------------


                            } catch (error) {
                                console.error('Error enhancing text:', error);
                                alert('Failed to enhance prompt. Please try again.');
                            } finally {
                                button.textContent = 'Enhance prompt';
                                button.disabled = false;
                             }
                        });

                    } catch (error) {
                        console.error('Error starting enhancement process:', error);
                        button.textContent = 'Enhance Prompt';
                        button.disabled = false;
                    }
                }
            };

            // --- REVERTED to simple button placement AFTER textarea ---
            textarea.parentNode.insertBefore(button, textarea.nextSibling);
            textarea.dataset.enhanceButtonAdded = 'true';
            // --- REMOVED all button container logic ---
        }
    }
}

async function enhanceText(text, apiKey) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey + '&candidate_count=1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
                    "${text}"

                    **Example of Rephrasing (for input: 'fix my blurry photo'):**

                    "I have a photo that is blurry. What are some common reasons why photos become blurry?  And what are the best ways to try and fix a blurry photo? Please provide step-by-step instructions and suggest both software and online tools I could use.  Also, are there any limitations to fixing blurry photos?  For example, are some types of blurriness impossible to correct? **Respond in the same language as the original user request.**"


                    Now, rephrase the following Original User Text into a detailed and user-ready prompt that can be directly used in a chat LLM.  Remember to ONLY return the rephrased prompt, ready to be used. Do not include any extra text or explanations. Just provide the rephrased prompt itself.
                    `
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
                topP: 0.8,
                topK: 40
            }
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}


function applyTextDirection(el) {
  // Skip anchor tags (<a>) to avoid interfering with links
  if (el.closest("nav")) return;

  const text = el.textContent.trim();

  if (!text) return;

  if (/[\u0600-\u06FF]/.test(text)) {
    el.setAttribute("dir", "rtl");
    el.style.textAlign = "right";
	el.style.fontFamily = 'Vazirmatn, sans-serif';
  } else if (/[A-Za-z]/.test(text)) {
    el.setAttribute("dir", "ltr");
    el.style.textAlign = "left";
  }
}

function processAllElements() {
  document.querySelectorAll("*").forEach(applyTextDirection);
}


// Run on page load and watch for dynamic content

const observer = new MutationObserver((mutationsList, observer) => { // Combined callback function

  // Functionality of the first observer (addEnhanceButton)
  addEnhanceButton(mutationsList, observer); // Pass mutationsList and observer if addEnhanceButton needs them


  // Functionality of the second observer (applyTextDirection to added nodes)
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Check if it's an Element node
        if (!node.closest("nav")) {
          applyTextDirection(node);
          node.querySelectorAll("*").forEach(applyTextDirection);
        }
      }
    });
  });

});

observer.observe(document.body, { childList: true, subtree: true });
addEnhanceButton();
processAllElements();