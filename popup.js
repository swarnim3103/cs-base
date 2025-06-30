let isListening = false;

function toggleRecognition() {
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) {
      console.error("No active tab found");
      document.getElementById("status").textContent = "Error: No active tab";
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: isListening ? 'stopRecognition' : 'startRecognition' 
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        document.getElementById("status").textContent = "Error: " + chrome.runtime.lastError.message;
      } else {
      }
    });
  });
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.type === 'recognitionStarted') {
    document.getElementById("start").textContent = "Stop Listening";
    document.getElementById("status").textContent = "Listening for commands...";
    document.getElementById("transcript").classList.add("listening");
    isListening = true;
  } else if (request.type === 'recognitionStopped') {
    document.getElementById("start").textContent = "Start Listening";
    document.getElementById("status").textContent = "Say 'start listening' or click button";
    document.getElementById("transcript").classList.remove("listening");
    isListening = false;
  } else if (request.type === 'transcript') {
    document.getElementById("lastCommand").textContent = request.transcript;
    document.getElementById("status").textContent = "Command recognized: " + request.transcript;
  } else if (request.type === 'error') {
    console.error("Error received from content script:", request.error);
    document.getElementById("start").textContent = "Start Listening";
    document.getElementById("status").textContent = "Error: " + request.error;
    document.getElementById("transcript").classList.remove("listening");
    isListening = false;
  } else if (request.type === 'commandExecuted') {
    document.getElementById("status").textContent = "Command executed!";
  }
});

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("status").textContent = "Checking extension status...";
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      document.getElementById("status").textContent = "Active tab: " + tabs[0].url.substring(0, 50) + "...";
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Content script not responding:", chrome.runtime.lastError);
          document.getElementById("status").textContent = "Content script not loaded. Try reloading the page.";
          document.getElementById("start").textContent = "Reload Page Required";
        } else {
          document.getElementById("status").textContent = "Ready! Click 'Start Listening' to test voice";
        }
      });
    } else {
      console.error("No active tab found");
      document.getElementById("status").textContent = "No active tab found";
    }
  });
  document.getElementById("test").addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'testCircle' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Test circle failed:", chrome.runtime.lastError);
            document.getElementById("status").textContent = "Test failed: " + chrome.runtime.lastError.message;
          } else {
            document.getElementById("status").textContent = "Test circle command sent";
          }
        });
      }
    });
  });
  
  document.getElementById("start").addEventListener("click", toggleRecognition);
});
