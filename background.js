chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'transcriptUpdate') {
    chrome.runtime.sendMessage(msg); // Forward message to popup
  }
  sendResponse({ success: true });
});
