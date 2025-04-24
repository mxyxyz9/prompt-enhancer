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