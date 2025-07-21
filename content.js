function showEnhancerModal() {
  const dialog = document.createElement('dialog');
  dialog.id = 'prompt-enhancer-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.classList.add('pe-modal');

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

  dialog.querySelector('#dismiss-btn').onclick = () => dialog.close();
  dialog.querySelector('#improve-btn').onclick = onImproveClick;
  dialog.querySelector('#copy-btn').onclick = onCopyClick;

  dialog.addEventListener('close', () => {
    dialog.remove();
  });

  function onImproveClick() {
    const userPrompt = document.getElementById('orig-prompt').value;
    chrome.runtime.sendMessage(
      { action: "enhancePrompt", text: userPrompt },
      (response) => {
        if (response.error) {
          document.getElementById('enh-prompt').value = response.error;
        } else {
          document.getElementById('enh-prompt').value = response.enhanced;
        }
      }
    );
  }

  function onCopyClick() {
    const enhancedPrompt = document.getElementById('enh-prompt').value;
    navigator.clipboard.writeText(enhancedPrompt);
  }
}

function addButton() {
    const targetTextarea = document.querySelector('textarea[data-id="root"]');
    if (targetTextarea) {
        const enhanceButton = document.createElement('button');
        enhanceButton.textContent = 'Enhance Prompt';
        enhanceButton.classList.add('enhance-btn');
        enhanceButton.onclick = showEnhancerModal;
        targetTextarea.parentElement.insertBefore(enhanceButton, targetTextarea.nextSibling);
    }
}

// Wait for the page to load before adding the button
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
} else {
    addButton();
}
