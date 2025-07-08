let enhanceButton = null;

// Function to remove the button
function removeEnhanceButton() {
  if (enhanceButton) {
    console.log('Removing enhance button.');
    enhanceButton.remove();
    enhanceButton = null;
  }
}

// Function to create the button
function createEnhanceButton(range) {
  removeEnhanceButton(); // Remove any existing button

  const selectedText = range.toString();
  if (selectedText.trim().length === 0) {
    console.log('No text selected or selection is empty.');
    return;
  }

  console.log('Creating enhance button for selected text:', selectedText);

  enhanceButton = document.createElement('button');
  enhanceButton.id = 'llm-enhance-button';
  enhanceButton.textContent = 'Enhance';
  // Storing the text directly on the button to avoid global state
  enhanceButton.dataset.selectedText = selectedText;

  // Apply styles directly for consistency
  enhanceButton.style.position = 'absolute';
  enhanceButton.style.zIndex = '99999';
  enhanceButton.style.background = '#ffffff';
  enhanceButton.style.color = '#1c1e21';
  enhanceButton.style.border = '1px solid #dddfe2';
  enhanceButton.style.padding = '6px 12px';
  enhanceButton.style.borderRadius = '6px';
  enhanceButton.style.cursor = 'pointer';
  enhanceButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  enhanceButton.style.fontSize = '14px';
  enhanceButton.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  enhanceButton.style.transition = 'all 0.2s ease-in-out';

  enhanceButton.addEventListener('click', () => {
    console.log('Enhance button clicked.');
    const textToEnhance = enhanceButton.dataset.selectedText;
    // Show some visual feedback that it's working
    enhanceButton.textContent = 'Enhancing...';
    enhanceButton.disabled = true;

    chrome.runtime.sendMessage({ action: 'enhanceText', text: textToEnhance }, (response) => {
      if (response && response.enhancedText) {
        console.log('Text enhanced successfully.');
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
  enhanceButton.style.top = `${rect.bottom + window.scrollY + 5}px`;
  enhanceButton.style.left = `${rect.left + window.scrollX}px`;
}

document.addEventListener('mouseup', (event) => {
  console.log('Mouseup event detected.');
  // Don't show button if we clicked on an existing enhance button
  if (event.target.id === 'llm-enhance-button') {
    console.log('Clicked on enhance button, not creating new one.');
    return;
  }

  const selection = window.getSelection();
  // Check if there's a selection and it's not just a collapsed cursor
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    // Clone the range to prevent it from being invalidated by subsequent DOM changes
    createEnhanceButton(selection.getRangeAt(0).cloneRange());
  } else {
    console.log('No active selection, removing button.');
    removeEnhanceButton();
  }
});

document.addEventListener('mousedown', (event) => {
  console.log('Mousedown event detected.');
  // Hide the button if clicking anywhere else on the page
  if (enhanceButton && !enhanceButton.contains(event.target)) {
    console.log('Clicked outside enhance button, removing it.');
    removeEnhanceButton();
  }
});