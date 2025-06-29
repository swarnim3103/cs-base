// Simple test content script with basic voice activation
console.log("TEST CONTENT SCRIPT LOADED!");

let testRecognition;
let isTestListening = false;

// Initialize basic speech recognition test
function initTestRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    console.log("Speech recognition available");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    testRecognition = new SpeechRecognition();
    testRecognition.continuous = true;
    testRecognition.interimResults = false;
    testRecognition.lang = 'en-US';

    testRecognition.onstart = function() {
      console.log("Test recognition started");
      isTestListening = true;
      chrome.runtime.sendMessage({ type: 'recognitionStarted' });
    };

    testRecognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Test heard:", transcript);
      
      chrome.runtime.sendMessage({ type: 'transcript', transcript: transcript });
      
      if (transcript.includes("stop") || transcript.includes("stop listening")) {
        console.log("Stop command detected");
        testRecognition.stop();
      } else if (transcript.includes("test")) {
        console.log("Creating test indicator");
        createTestIndicator();
      }
    };

    testRecognition.onerror = function(event) {
      console.error("Test recognition error:", event.error);
      isTestListening = false;
      chrome.runtime.sendMessage({ type: 'error', error: event.error });
    };

    testRecognition.onend = function() {
      console.log("Test recognition ended");
      isTestListening = false;
      chrome.runtime.sendMessage({ type: 'recognitionStopped' });
    };

    return true;
  }
  return false;
}

function createTestIndicator() {
  const indicator = document.createElement('div');
  indicator.style.position = 'fixed';
  indicator.style.top = '100px';
  indicator.style.right = '20px';
  indicator.style.width = '100px';
  indicator.style.height = '50px';
  indicator.style.background = 'lime';
  indicator.style.color = 'black';
  indicator.style.zIndex = '99999';
  indicator.style.textAlign = 'center';
  indicator.style.lineHeight = '50px';
  indicator.style.fontSize = '14px';
  indicator.style.fontWeight = 'bold';
  indicator.style.borderRadius = '10px';
  indicator.textContent = 'VOICE WORKS!';
  
  if (document.body) {
    document.body.appendChild(indicator);
    console.log("Test indicator created");
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator);
      }
    }, 3000);
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Test content script received message:", request);
  
  if (request.action === 'ping') {
    console.log("Responding to ping");
    sendResponse({ success: true, message: "Test content script working!" });
  } else if (request.action === 'startRecognition') {
    console.log("Starting test recognition");
    if (testRecognition && !isTestListening) {
      try {
        testRecognition.start();
        console.log("Test recognition started successfully");
      } catch (error) {
        console.error("Error starting test recognition:", error);
        chrome.runtime.sendMessage({ type: 'error', error: error.message });
      }
    }
  } else if (request.action === 'stopRecognition') {
    console.log("Stopping test recognition");
    if (testRecognition && isTestListening) {
      testRecognition.stop();
    }
  } else if (request.action === 'testCircle') {
    console.log("Creating test circle");
    createTestCircle();
    sendResponse({ success: true });
  }
  
  return true;
});

function createTestCircle() {
  const circle = document.createElement('div');
  circle.style.position = 'fixed';
  circle.style.top = '50px';
  circle.style.left = '50px';
  circle.style.width = '50px';
  circle.style.height = '50px';
  circle.style.background = 'red';
  circle.style.borderRadius = '50%';
  circle.style.zIndex = '99999';
  circle.style.border = '3px solid white';
  
  if (document.body) {
    document.body.appendChild(circle);
    console.log("Test circle added");
  } else {
    console.log("No body to add circle to");
  }
}

// Create load indicator
setTimeout(() => {
  if (document.body) {
    const testDiv = document.createElement('div');
    testDiv.textContent = 'EXTENSION LOADED';
    testDiv.style.position = 'fixed';
    testDiv.style.top = '0px';
    testDiv.style.left = '0px';
    testDiv.style.background = 'blue';
    testDiv.style.color = 'white';
    testDiv.style.padding = '10px';
    testDiv.style.zIndex = '99999';
    testDiv.style.fontSize = '14px';
    testDiv.style.fontWeight = 'bold';
    testDiv.style.borderRadius = '5px';
    document.body.appendChild(testDiv);
    console.log("Load indicator added");
    
    // Initialize speech recognition
    initTestRecognition();
    
    // Remove load indicator after 3 seconds
    setTimeout(() => {
      if (document.body.contains(testDiv)) {
        document.body.removeChild(testDiv);
      }
    }, 3000);
  } else {
    console.log("No document.body available");
  }
}, 1000);
