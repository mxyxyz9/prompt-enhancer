document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('save-btn');
  const apiKeyInput = document.getElementById('api-key');

  // Load the saved API key
  chrome.storage.local.get('apiKey', (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });

  // Save the API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value;
    chrome.storage.local.set({ apiKey }, () => {
      alert('API key saved!');
    });
  });
});