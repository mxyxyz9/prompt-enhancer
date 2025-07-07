let enhanceButton = null;

// Function to remove the button
function removeEnhanceButton() {
  if (enhanceButton) {
    enhanceButton.remove();
    enhanceButton = null;
  }
}

// Function to create the button
function createEnhanceButton(range) {
  removeEnhanceButton(); // Remove any existing button

  const selectedText = range.toString();
  if (selectedText.trim().length === 0) return;

  enhanceButton = document.createElement('button');
  enhanceButton.id = 'llm-enhance-button';
  enhanceButton.textContent = 'Enhance';
  // Storing the text directly on the button to avoid global state
  enhanceButton.dataset.selectedText = selectedText;

  enhanceButton.addEventListener('click', () => {
    const textToEnhance = enhanceButton.dataset.selectedText;
    // Show some visual feedback that it's working
    enhanceButton.textContent = 'Enhancing...';
    enhanceButton.disabled = true;

    chrome.runtime.sendMessage({ action: 'enhanceText', text: textToEnhance }, (response) => {
      if (response && response.enhancedText) {
        // The selection might be lost, so we re-select the original range
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Replace the selected text
        const newTextNode = document.createTextNode(response.enhancedText);
        range.deleteContents();
        range.insertNode(newTextNode);

        // Move cursor after the inserted text
        range.setStartAfter(newTextNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

      } else if (response && response.error) {
        console.error('Enhancement Error:', response.error);
        alert(`Error: ${response.error}`); // Notify user of the error
      }
      removeEnhanceButton();
    });
  });

  document.body.appendChild(enhanceButton);
  const rect = range.getBoundingClientRect();
  enhanceButton.style.position = 'absolute';
  enhanceButton.style.top = `${rect.bottom + window.scrollY + 5}px`;
  enhanceButton.style.left = `${rect.left + window.scrollX}px`;
  enhanceButton.style.zIndex = '99999';
}

document.addEventListener('mouseup', (event) => {
  // Don't show button if we clicked on an existing enhance button
  if (event.target.id === 'llm-enhance-button') {
    return;
  }

  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    createEnhanceButton(selection.getRangeAt(0).cloneRange());
  } else {
    removeEnhanceButton();
  }
});

document.addEventListener('mousedown', (event) => {
  // Hide the button if clicking anywhere else on the page
  if (enhanceButton && !enhanceButton.contains(event.target)) {
    removeEnhanceButton();
  }
});