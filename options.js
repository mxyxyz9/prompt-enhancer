document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const customPromptInput = document.getElementById('custom-prompt');
  const saveButton = document.getElementById('save-button');
  const statusParagraph = document.getElementById('status');

  // Function to show status messages
  function showStatus(message, isError = false) {
    statusParagraph.textContent = message;
    statusParagraph.style.color = isError ? '#d93025' : '#28a745';
    setTimeout(() => {
      statusParagraph.textContent = '';
    }, 3000);
  }

  // Load saved settings
  chrome.storage.sync.get(['geminiApiKey', 'customPrompt'], (data) => {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
    }
    if (data.customPrompt) {
      customPromptInput.value = data.customPrompt;
    }
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const customPrompt = customPromptInput.value.trim();

    if (!apiKey) {
      showStatus('API Key cannot be empty.', true);
      return;
    }

    chrome.storage.sync.set({ 
      geminiApiKey: apiKey, 
      customPrompt: customPrompt 
    }, () => {
      showStatus('Settings saved successfully!');
    });
  });
});
