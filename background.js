chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'transcriptUpdate') {
    chrome.runtime.sendMessage(msg);
  }
  sendResponse({ success: true });
});
