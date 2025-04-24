Chrome Extension Build Plan for Prompt Enhancement
Overview
This plan outlines the development of a Chrome extension that enhances user prompts in AI chatbots, such as ChatGPT, by integrating with the Gemini API from Google AI Studio. The extension adds a button next to the chatbot’s input box. When clicked, it captures the text, sends it to the Gemini API for enhancement, and updates the input box with the improved prompt. The implementation involves JavaScript, Chrome extension APIs, and a build process using Webpack to include the @google/genai library.
Objectives

Add a button to the chatbot’s input interface.
Capture and enhance the prompt using the Gemini API.
Replace the original prompt with the enhanced version.
Provide a user-friendly way to manage the API key.
Ensure secure handling of the API key and robust error handling.

Prerequisites

Google AI Studio Account: Required to obtain an API key from Google AI Studio.
Node.js: Needed for installing dependencies and setting up the build process.
Chrome Browser: For testing and loading the extension.
Basic JavaScript Knowledge: Familiarity with JavaScript, HTML, and Chrome extension development is helpful.
Development Environment: A code editor (e.g., VS Code) and terminal for running build commands.

Project Structure
The extension consists of the following files:



File
Purpose



manifest.json
Defines the extension’s metadata, permissions, and scripts.


content.js
Injects the button and handles user interactions on the chatbot page.


background.js
Makes API calls to the Gemini API and communicates with the content script.


options.html
Provides a UI for users to input their API key.


options.js
Saves and loads the API key using Chrome storage.


webpack.config.js
Configures Webpack to bundle the background script with dependencies.


Detailed Steps
1. Obtain a Gemini API Key

Visit Google AI Studio and sign up or log in.
Navigate to the dashboard and create a new project if prompted.
Generate an API key from the API key section.
Save the API key securely, as it will be used in the extension.

2. Set Up the Extension Project

Create a new directory (e.g., prompt-enhancer-extension).
Initialize a Node.js project:npm init -y


Install the @google/genai library:npm install @google/genai


Install Webpack and Webpack CLI:npm install --save-dev webpack webpack-cli


Create the following files with the specified content.

manifest.json
Defines the extension’s configuration, including permissions and script locations.
{
  "manifest_version": 3,
  "name": "Prompt Enhancer",
  "version": "1.0",
  "description": "Enhances prompts in AI chatbots using the Gemini API.",
  "permissions": ["storage"],
  "background": {
    "service_worker": "background.bundle.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://chat.openai.com/*"],
      "js": ["content.js"]
    }
  ],
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}

content.js
Injects a button next to the chatbot’s input box and handles the enhancement process.
// Find the input box (adjust selector as needed)
const inputBox = document.querySelector('#prompt-textarea');

if (inputBox) {
  // Create and style the button
  const button = document.createElement('button');
  button.textContent = 'Enhance Prompt';
  button.style.marginLeft = '10px';
  inputBox.parentNode.appendChild(button);

  // Handle button click
  button.addEventListener('click', () => {
    const originalPrompt = inputBox.value;
    chrome.runtime.sendMessage({ action: 'enhancePrompt', prompt: originalPrompt }, (response) => {
      if (response.enhancedPrompt) {
        inputBox.value = response.enhancedPrompt;
      } else if (response.error) {
        alert('Error: ' + response.error);
      }
    });
  });
}

background.js
Handles API calls to the Gemini API using the @google/genai library.
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
    return true; // Indicates asynchronous response
  }
});

options.html
Provides a simple UI for entering the API key.
<!DOCTYPE html>
<html>
<head>
  <title>Prompt Enhancer Options</title>
</head>
<body>
  <label for="apiKey">API Key:</label>
  <input type="text" id="apiKey">
  <button id="save">Save</button>
  <script src="options.js"></script>
</body>
</html>

options.js
Saves and loads the API key using Chrome storage.
document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({ apiKey }, () => {
    alert('API key saved');
  });
});

// Load existing API key
chrome.storage.sync.get('apiKey', (data) => {
  if (data.apiKey) {
    document.getElementById('apiKey').value = data.apiKey;
  }
});

webpack.config.js
Configures Webpack to bundle the background script with dependencies.
const path = require('path');

module.exports = {
  entry: './background.js',
  output: {
    filename: 'background.bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.js']
  }
};

3. Configure the Content Script

Selector Identification: Inspect the chatbot’s webpage (e.g., ChatGPT) to find the input box’s CSS selector. For ChatGPT, it’s often a textarea with an ID like #prompt-textarea. Update the selector in content.js if necessary.
Button Placement: The button is appended to the input box’s parent node. Adjust the styling (e.g., marginLeft) for better positioning.
Cross-Chatbot Compatibility: For other chatbots, add their URLs to the matches array in manifest.json and verify the input box selector.

4. Implement the Background Script

API Integration: The @google/genai library is used to call the Gemini API. The model gemini-2.0-flash-001 is selected for its balance of speed and capability, but other models can be used (see Gemini API Docs).
Prompt Design: The API is sent a prompt like Enhance this prompt for better AI response: "${originalPrompt}". This instructs the model to improve clarity and effectiveness.
Error Handling: Checks for a missing API key and catches API call errors, returning appropriate responses to the content script.

5. Set Up the Options Page

User Interface: A simple form allows users to input their API key, which is saved to chrome.storage.sync for secure storage.
Persistence: The saved API key is loaded when the options page is opened, improving user experience.

6. Build the Extension

Run the Webpack build command to bundle the background script:npx webpack


Ensure the dist folder containing background.bundle.js is included in the extension directory.
Copy all other files (manifest.json, content.js, options.html, options.js) to the extension directory.

7. Test and Deploy

Load the Extension:
Open Chrome and navigate to chrome://extensions/.
Enable “Developer mode” and click “Load unpacked.”
Select the extension directory.


Set the API Key:
Open the extension’s options page via the extension menu.
Enter and save the API key.


Test the Functionality:
Visit ChatGPT or another supported chatbot.
Type a prompt in the input box.
Click the “Enhance Prompt” button and verify that the prompt is updated.


Debugging:
Check the console in Chrome’s DevTools for errors.
Verify the API key and selector accuracy if issues arise.



Considerations

API Key Security: Storing the API key in chrome.storage.sync is secure, as it’s inaccessible to web pages. Avoid including the API key in content scripts.
Selector Variability: Input box selectors may change with website updates. Regularly test and update the selector in content.js.
API Limits: The Gemini API may have usage quotas or costs. Check Google AI Studio for details.
Build Process: Webpack is used for simplicity, but other bundlers like Rollup can be substituted if preferred.
Extending to Other Chatbots: Add additional URLs to manifest.json and test selectors for each chatbot.

Example Workflow

User types “Tell me about dogs” in ChatGPT’s input box.
User clicks the “Enhance Prompt” button.
The content script sends the prompt to the background script.
The background script calls the Gemini API with “Enhance this prompt for better AI response: ‘Tell me about dogs’”.
The API returns an enhanced prompt, e.g., “Provide a detailed description of dogs, including their history, breeds, and roles in society.”
The content script updates the input box with the enhanced prompt.
The user submits the enhanced prompt to ChatGPT for a better response.

Troubleshooting

Button Not Appearing: Verify the selector in content.js matches the input box. Check the matches URL in manifest.json.
API Errors: Ensure the API key is correctly set in the options page. Check for network issues or API quota limits.
Build Issues: Confirm Node.js and Webpack are installed. Check webpack.config.js for correct paths.

Future Enhancements

Custom Prompt Templates: Allow users to define how prompts are enhanced (e.g., tone, specificity).
Multiple Models: Support selecting different Gemini models via the options page.
UI Improvements: Enhance the button’s styling or add a loading indicator during API calls.
Broader Compatibility: Automatically detect input boxes on various chatbot platforms.

