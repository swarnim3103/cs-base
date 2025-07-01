let isListening = false;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("start").addEventListener("click", toggleRecognition);
});

function toggleRecognition() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: isListening ? 'stop' : 'start' 
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'started') {
    document.getElementById("start").textContent = "Stop Listening";
    document.getElementById("status").textContent = "Listening...";
    document.getElementById("transcript").classList.add("listening");
    isListening = true;
  } else if (request.type === 'stopped') {
    document.getElementById("start").textContent = "Start Listening";
    document.getElementById("status").textContent = "Ready";
    document.getElementById("transcript").classList.remove("listening");
    isListening = false;
  } else if (request.type === 'transcript') {
    document.getElementById("lastCommand").textContent = request.text;
  }
});
