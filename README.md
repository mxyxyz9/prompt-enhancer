Perfect, I’ll now revise the technical plan to include a modal-based UI like in your screenshot. This includes a two-field layout (Original Prompt + Enhanced Prompt), editable input, and an Improve button, with optional clipboard and insert functionality.

I’ll include the modal’s design integration, event handling, and how it connects with Gemini's API. I’ll get back to you shortly with the detailed update.


# Chrome Extension Architecture: Enhanced Prompt Modal with Gemini AI

The extension uses Manifest V3 with a background service worker and a content script injected into target pages (e.g. the ChatGPT interface).  The content script adds an **“Enhance Prompt”** button near the input field. When clicked, it dynamically creates and displays a modal dialog containing two sections – an **Original Prompt** textarea and an **Enhanced Prompt** readonly field – plus action buttons (“Improve”, “Dismiss”, and optionally “Copy/Insert”).  Clicking **Improve** sends the original prompt to the background script, which calls the Gemini API (with the user’s API key) and returns the refined prompt.  The background uses `chrome.runtime.onMessage`/`sendMessage` to communicate with the content script.  The **Dismiss** button or pressing **Esc** will close the modal.  On **Copy/Insert**, the enhanced prompt is inserted back into the page’s input field.  Throughout, we follow best practices: styling with external CSS, using ARIA roles/attributes for accessibility, trapping focus in the modal, and respecting Chrome’s security (CSP, permissions) requirements.

## Extension Components and Flow

* **Manifest (Manifest V3)**: Declares the content script (injected into ChatGPT pages) and the background service worker. Includes necessary permissions (`storage` for API key, host permissions for the chat site and Gemini API domain, e.g. `"https://chat.openai.com/*"` and the Gemini REST endpoint), and declares the background as `"service_worker"`.  For example:

  ```json
  {
    "manifest_version": 3,
    "name": "Prompt Enhancer",
    "version": "1.0",
    "permissions": ["storage"], 
    "host_permissions": [
      "https://chat.openai.com/*", 
      "https://*.googleapis.com/*"
    ],
    "background": {
      "service_worker": "background.js",
      "type": "module"
    },
    "content_scripts": [
      {
        "matches": ["https://chat.openai.com/*"],
        "js": ["contentScript.js"],
        "css": ["modal.css"]
      }
    ]
  }
  ```

  This ensures the content script (with its CSS) is injected into matching pages automatically.

* **Content Script (`contentScript.js`)**: Runs in the page’s context (but isolated from page scripts). On page load it locates the prompt input area and injects an **Enhance Prompt** button.  Clicking that button triggers the creation of the modal dialog in the DOM (using `document.createElement`) and shows it (e.g. via the HTML `<dialog>` element’s `showModal()`, or by adding a visible fixed-position `<div>`).  The content script attaches event listeners for all buttons in the modal: **Improve**, **Dismiss**, and **Copy/Insert**.  When **Improve** is clicked, the content script reads the “Original Prompt” text and does:

  ```js
  // Send message to background to enhance the prompt
  const userPrompt = document.getElementById('orig-prompt').value;
  chrome.runtime.sendMessage(
    { action: "enhancePrompt", text: userPrompt },
    (response) => {
      // Populate the Enhanced Prompt field with result
      document.getElementById('enh-prompt').value = response.enhanced;
    }
  );
  ```

  The above uses `chrome.runtime.sendMessage` from the content script to the background script.

* **Background Service Worker (`background.js`)**: Listens for messages from the content script. For example:

  ```js
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "enhancePrompt") {
      // Retrieve API key from storage (or options page)
      const { apiKey } = await chrome.storage.local.get("apiKey");
      // Call Gemini API (REST) with the prompt
      const resp = await fetch("https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT/locations/us-central1/publishers/google/models/chat-bison:generateMessage?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: message.text },
          // model parameters...
        })
      });
      const data = await resp.json();
      // Send back the enhanced prompt text
      sendResponse({ enhanced: data.candidates[0].output });
      return true; // keep message channel open for async response
    }
  });
  ```

  This uses `chrome.runtime.onMessage` to handle the request and `sendResponse` when done. Because `fetch` is async, we `return true;` to allow the callback to run after the promise resolves.  The background script must use the global `fetch()` API (MV3 requires replacing XHR with `fetch()`) and include host permission for the Gemini API endpoint.

* **Message Passing**: Communication between content and background uses the `chrome.runtime.sendMessage` / `onMessage` API. The content script sends a JSON message with an action and data; the background listens and responds via `sendResponse`. For example, the content script code above calls `sendMessage(...)` and the background calls `sendResponse({enhanced: ...})`. (If the background did not return `true`, the channel would close before the async fetch completes.)

* **API Key Storage**: The extension must obtain a Gemini API key. Best practice is **not** to hardcode it. Instead, the user can input their API key in an extension options page or a popup, which is then stored using the Chrome Storage API (`chrome.storage.local.set({ apiKey: "USER_KEY" })`).  The background can later retrieve it with `chrome.storage.local.get("apiKey")`. Chrome’s dev guide advises “Never share your keys... Ask users to provide an API key”.  The extension needs the `"storage"` permission to use `chrome.storage`.

## Injecting and Styling the Modal UI

&#x20;*Figure: Example Prompt Enhancer modal UI. The left textarea is the “Original Prompt” (user-editable) and the right textarea is the “Enhanced Prompt” (read-only). Buttons at bottom allow improving or dismissing the modal.*

The content script injects the modal HTML into the page **only when needed** (i.e. upon button click). One approach is to create a `<dialog role="dialog" aria-modal="true">` element (supported in modern browsers) and call `dialog.showModal()`. For example (in `contentScript.js`):

```js
function showEnhancerModal() {
  const dialog = document.createElement('dialog');
  dialog.id = 'prompt-enhancer-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.classList.add('pe-modal');

  // Build inner HTML
  dialog.innerHTML = `
    <h2>Prompt Enhancer (Beta)</h2>
    <label for="orig-prompt">Original Prompt:</label>
    <textarea id="orig-prompt" placeholder="Type something here..."></textarea>
    <label for="enh-prompt">Enhanced Prompt:</label>
    <textarea id="enh-prompt" readonly placeholder="Your prompt will be enhanced here..."></textarea>
    <div class="pe-buttons">
      <button id="dismiss-btn">Dismiss</button>
      <button id="improve-btn">Improve</button>
      <button id="copy-btn">Copy</button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.showModal();

  // Add event listeners:
  dialog.querySelector('#dismiss-btn').onclick = () => dialog.close();
  dialog.querySelector('#improve-btn').onclick = onImproveClick;
  dialog.querySelector('#copy-btn').onclick = onCopyClick;
  
  // Accessibility: trap focus and handle Esc key
  dialog.addEventListener('keydown', trapFocusAndEsc);
}
```

In this snippet, `showModal()` displays the dialog (with a backdrop).  Styling (in `modal.css`) should center the modal, dim the background, and make the layout clean (e.g. grid or flex for the textareas side by side).  All styles should be loaded as an external CSS file (declared in the manifest) to comply with CSP. A simple example in CSS:

```css
.pe-modal {
  width: 400px;
  padding: 20px;
  border: none;
  border-radius: 8px;
}
.pe-modal::backdrop { 
  background: rgba(0,0,0,0.5); 
}
.pe-modal label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}
.pe-modal textarea {
  width: 100%;
  min-height: 80px;
}
.pe-buttons {
  margin-top: 15px;
  text-align: right;
}
.pe-buttons button {
  margin-left: 10px;
}
```

This code is illustrative – the actual CSS can be adjusted for better theming. The key is to isolate styles (e.g. using a unique prefix) to avoid collisions with the page’s CSS.

## Accessibility and Focus Management

The modal must be keyboard-accessible and announced properly to assistive technologies.  We assign `role="dialog"` and `aria-modal="true"` to the modal container.  When the modal opens, JavaScript should immediately move focus into the first focusable element (e.g. the first textarea).  Focus **must be trapped** inside the modal: tabbing should cycle through only the modal’s controls, not the page behind it. One implementation is to handle the `keydown` event on the dialog: if `e.key === 'Tab'`, programmatically loop focus within.  If `e.key === 'Escape'`, close the modal (calling `dialog.close()`).  When the modal closes, focus should return to the **Enhance Prompt** button that opened it. Example code to close on Esc:

```js
function trapFocusAndEsc(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.close();
    enhanceButton.focus(); // return focus to the opener
  }
  // (Optional: handle Tab to trap focus)
}
```

Using `aria-modal="true"` informs screen readers that the background content is inert.  All interactive controls (buttons, textareas) inside the modal should be reachable via `Tab` and have appropriate labels.  For example, associate `<label>` with each `<textarea>` via `for`/`id`. Ensuring contrast, clear labels, and logical tab order completes the accessibility requirements.

## Gemini API Integration Details

When the user clicks **Improve**, the content script sends the text to the background. The background (service worker) uses the Gemini REST API to enhance the prompt.  This requires a valid API key (e.g. a Google Cloud API key for Vertex AI). The background code must have internet permission for the Gemini endpoint (specified in `host_permissions`).  A typical fetch call might look like:

```js
const response = await fetch('https://vertexai.googleapis.com/v1/projects/PROJECT/locations/global/publishers/google/models/text-bison-001:generateText?key=' + apiKey, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: { text: message.text },
    temperature: 0.7,
    // ... other parameters ...
  })
});
```

After receiving the JSON response, the background extracts the generated text and sends it back via `sendResponse`. This asynchronous pattern requires returning `true` in the message listener (as shown above) to keep the channel open.

Error handling should also be added (e.g. try/catch around fetch, and inform the content script if the API call fails). The content script can then disable the “Improve” button during the fetch and re-enable when done to prevent multiple clicks.

## Data Flow Summary

1. **User clicks Enhance**: Content script’s button handler calls `showEnhancerModal()`.
2. **User edits original prompt** in the modal textarea.
3. **User clicks Improve**: Content script sends a message `{action: "enhancePrompt", text: ...}` to the background.
4. **Background receives message**: It reads the stored API key (`chrome.storage.local.get`), calls the Gemini API with `fetch()`, parses the JSON, and returns `sendResponse({ enhanced: ... })`.
5. **Content script updates UI**: In the callback from `sendMessage`, the enhanced prompt field is filled. Enable the “Copy” button.
6. **User can Copy/Insert**: The script takes the enhanced text and inserts it into the original input field on the page (e.g. the ChatGPT textbox). This may involve focusing that field and setting its `.value`.
7. **Dismiss**: Either clicking **Dismiss** or pressing Esc closes the modal and restores focus. The dialog element is removed from the DOM (e.g. using `.remove()` when closed).

Throughout this flow, all messaging and API calls respect Chrome’s extension CSP. The content script never directly makes cross-origin requests – it asks the background to do so. The background’s fetch must comply with `host_permissions`. The manifest should **not** include the API key; instead, we use `chrome.storage` (with `"storage"` permission) to keep it secure.

## Chrome Security and Best Practices

* **Isolated World**: Content scripts run in an isolated JS environment separate from the page. They cannot directly call page functions or access its JS variables. All interaction with the page must be done via the DOM (e.g. reading/writing text fields) or messages to background.
* **Content Security**: Manifest V3 forbids inline scripts or `eval()`. All code is in external JS files. Styling is done via external CSS or setting `style` in script (which is allowed). We avoid loading remote scripts. Any HTML templates built by scripts should not include `<script>` tags with inline code.
* **Permissions**: List only the minimum needed. For example, include `"activeTab"` only if programmatically injecting or using `chrome.scripting`. Since we inject content script via `content_scripts`, we may not need `"activeTab"`. We do include host permissions for the target site and the Gemini API endpoint. If using `chrome.scripting` to inject the modal CSS at runtime, include the `"scripting"` permission.
* **API Key Handling**: Do not hardcode secrets. Per Chrome’s guidance, either have the user enter their own API key (stored with `chrome.storage`) or proxy requests through a secure server. In this plan we use `chrome.storage.local`.  Remember to handle `chrome.storage` asynchronously (it returns Promises in MV3) and to sanitize/validate any user-provided key.
* **Performance**: The modal is only injected when needed and removed when closed. No persistent UI elements are left behind. The background service worker is event-driven (only runs when handling messages or alarms) to save resources.

## UI Logic and Behavior

* The **Improve** button should be disabled until there is text in the Original Prompt field. An `input` event listener on the textarea can enable/disable this button.
* The **Copy/Insert** button (if implemented) can insert the enhanced prompt back into the page’s actual input. For example:

  ```js
  const pageInput = document.querySelector('textarea[data-id="chat-input"]');
  pageInput.value = enhancedText;
  pageInput.focus();
  ```
* The **Dismiss** button and clicking outside the dialog (or pressing Esc) should clear and remove the modal element. For a `<dialog>`, `dialog.close()` can be used. After closing, call `dialog.remove()` to clean up the DOM.
* Keyboard navigation: ensure `Tab`/`Shift+Tab` cycle through `[Original Prompt, Enhanced Prompt, Improve, Copy, Dismiss]` and do not escape the dialog. Focus trapping code or the HTML `inert` attribute on background can be used. Using `aria-modal="true"` already signals to screen readers that the background is not accessible.

## Accessibility Considerations

* Use semantic HTML: a `<dialog>` or a `<div role="dialog">` with an accessible name (e.g. an `<h2>` inside or `aria-labelledby`).
* Each control has an accessible label (`<label>` elements). The “Original Prompt” and “Enhanced Prompt” fields are labeled.
* Announce status: while waiting for Gemini, the script could show a loading spinner or “Enhancing…” message (with `aria-busy`).
* Ensure color contrast and focus outlines in CSS so that keyboard users can see where the focus is.
* Screen readers should read the dialog title and content; use `aria-live` if needed when the enhanced prompt appears.

## Summary

This plan outlines a complete flow: a content script adds an **Enhance Prompt** button and, when clicked, injects an accessible modal UI into the page DOM.  The modal collects user input and, upon “Improve”, communicates via `chrome.runtime` messaging with the extension’s background script.  The background calls the Gemini API (using a stored API key) and returns the improved prompt text.  The content script then updates the modal and optionally inserts text back into the host page.  All parts adhere to Chrome’s MV3 constraints (no inline code, proper permissions) and best practices for UI injection and accessibility.

**References:** The Chrome Extension documentation and examples describe manifest and content script injection patterns, message passing techniques, and using the Fetch API in a service worker.  The MDN ARIA docs emphasize trapping focus in modals.  Google’s extension guidelines stress not embedding API keys and instead obtaining them securely. All these inform the design above.
