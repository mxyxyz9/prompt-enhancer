document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');

    // بارگیری کلید API ذخیره شده هنگام باز شدن popup
    chrome.storage.local.get(['geminiApiKey'], function(result) {
        apiKeyInput.value = result.geminiApiKey || ''; // اگر کلیدی وجود نداشت، فیلد را خالی بگذار
    });

    saveButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        chrome.storage.local.set({geminiApiKey: apiKey}, function() {
            statusDiv.textContent = 'API Key saved.';
            setTimeout(function() {
                statusDiv.textContent = ''; // پاک کردن پیام بعد از چند ثانیه
            }, 2000);
        });
    });
});