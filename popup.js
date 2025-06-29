let isListening = false;

// Send message to content script to start/stop recognition
function toggleRecognition() {
  console.log("Toggle recognition called, current state:", isListening);
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) {
      console.error("No active tab found");
      document.getElementById("status").textContent = "Error: No active tab";
      return;
    }
    
    console.log("Sending message to tab:", tabs[0].id, "Action:", isListening ? 'stopRecognition' : 'startRecognition');
    
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: isListening ? 'stopRecognition' : 'startRecognition' 
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        document.getElementById("status").textContent = "Error: " + chrome.runtime.lastError.message;
      } else {
        console.log("Message sent successfully, response:", response);
      }
    });
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Popup received message:", request);
  
  if (request.type === 'recognitionStarted') {
    console.log("Recognition started message received");
    document.getElementById("start").textContent = "Stop Listening";
    document.getElementById("status").textContent = "Listening for commands...";
    document.getElementById("transcript").classList.add("listening");
    isListening = true;
  } else if (request.type === 'recognitionStopped') {
    console.log("Recognition stopped message received");
    document.getElementById("start").textContent = "Start Listening";
    document.getElementById("status").textContent = "Say 'start listening' or click button";
    document.getElementById("transcript").classList.remove("listening");
    isListening = false;
  } else if (request.type === 'transcript') {
    console.log("Transcript received:", request.transcript);
    document.getElementById("lastCommand").textContent = request.transcript;
    document.getElementById("status").textContent = "Command recognized: " + request.transcript;
  } else if (request.type === 'error') {
    console.error("Error received from content script:", request.error);
    document.getElementById("start").textContent = "Start Listening";
    document.getElementById("status").textContent = "Error: " + request.error;
    document.getElementById("transcript").classList.remove("listening");
    isListening = false;
  } else if (request.type === 'commandExecuted') {
    console.log("Command executed message received");
    document.getElementById("status").textContent = "Command executed!";
  }
});

document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup DOM loaded");
  
  // Add status info
  document.getElementById("status").textContent = "Checking extension status...";
  
  // Check if speech recognition is supported by sending a message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      console.log("Active tab found:", tabs[0].url);
      document.getElementById("status").textContent = "Active tab: " + tabs[0].url.substring(0, 50) + "...";
      
      // Try to ping the content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Content script not responding:", chrome.runtime.lastError);
          document.getElementById("status").textContent = "Content script not loaded. Try reloading the page.";
          document.getElementById("start").textContent = "Reload Page Required";
        } else {
          console.log("Content script responded:", response);
          document.getElementById("status").textContent = "Ready! Click 'Start Listening' to test voice";
        }
      });
    } else {
      console.error("No active tab found");
      document.getElementById("status").textContent = "No active tab found";
    }
  });
  
  // Test circle button
  document.getElementById("test").addEventListener("click", function() {
    console.log("Test circle button clicked");
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'testCircle' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Test circle failed:", chrome.runtime.lastError);
            document.getElementById("status").textContent = "Test failed: " + chrome.runtime.lastError.message;
          } else {
            console.log("Test circle response:", response);
            document.getElementById("status").textContent = "Test circle command sent";
          }
        });
      }
    });
  });
  
  document.getElementById("start").addEventListener("click", toggleRecognition);
});
