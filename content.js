let recognition;
let activationRecognition; // Separate recognition for activation
let isListening = false;
let mouseX = window.innerWidth / 2;  // Start mouse in center
let mouseY = window.innerHeight / 2;
let mouseIndicator = null;

// Create visual mouse indicator
function createMouseIndicator() {
  console.log("Attempting to create mouse indicator");
  if (mouseIndicator) {
    console.log("Mouse indicator already exists");
    return;
  }
  
  if (!document.body) {
    console.error("Document body not available yet");
    setTimeout(createMouseIndicator, 100);
    return;
  }
  
  mouseIndicator = document.createElement('div');
  mouseIndicator.style.position = 'fixed';
  mouseIndicator.style.width = '20px';
  mouseIndicator.style.height = '20px';
  mouseIndicator.style.background = 'red';
  mouseIndicator.style.border = '2px solid white';
  mouseIndicator.style.borderRadius = '50%';
  mouseIndicator.style.zIndex = '10000';
  mouseIndicator.style.pointerEvents = 'none';
  mouseIndicator.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
  mouseIndicator.style.transition = 'all 0.1s ease';
  
  try {
    document.body.appendChild(mouseIndicator);
    updateMouseIndicator();
    console.log("Mouse indicator created successfully");
  } catch (error) {
    console.error("Error creating mouse indicator:", error);
  }
}

// Update mouse indicator position
function updateMouseIndicator() {
  if (mouseIndicator) {
    mouseIndicator.style.left = (mouseX - 10) + 'px';
    mouseIndicator.style.top = (mouseY - 10) + 'px';
  }
}

// Remove mouse indicator
function removeMouseIndicator() {
  console.log("Attempting to remove mouse indicator");
  if (mouseIndicator && document.body) {
    try {
      document.body.removeChild(mouseIndicator);
      mouseIndicator = null;
      console.log("Mouse indicator removed successfully");
    } catch (error) {
      console.error("Error removing mouse indicator:", error);
      mouseIndicator = null;
    }
  }
}

// Initialize speech recognition
function initSpeechRecognition() {
  console.log("Initializing speech recognition");
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    console.log("Speech recognition API available");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Main recognition for commands
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
      console.log("Main speech recognition started");
      isListening = true;
      createMouseIndicator(); // Show mouse indicator when listening starts
      try {
        chrome.runtime.sendMessage({ type: 'recognitionStarted' });
      } catch (error) {
        console.error("Error sending recognition started message:", error);
      }
    };

    recognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Heard:", transcript);
      
      // Send transcript to popup
      try {
        chrome.runtime.sendMessage({ type: 'transcript', transcript: transcript });
      } catch (error) {
        console.error("Error sending transcript:", error);
      }
      
      // Check for stop command first
      if (transcript.includes("stop listening")) {
        console.log("Stop listening command detected");
        try {
          chrome.runtime.sendMessage({ type: 'transcript', transcript: transcript + " (stopping...)" });
        } catch (error) {
          console.error("Error sending stop message:", error);
        }
        recognition.stop();
        return;
      }
      
      // Handle other commands
      handleCommand(transcript);
      
      // Notify popup that command was executed
      try {
        chrome.runtime.sendMessage({ type: 'commandExecuted' });
      } catch (error) {
        console.error("Error sending command executed message:", error);
      }
    };

    recognition.onerror = function(event) {
      console.error("Speech recognition error:", event.error);
      isListening = false;
      removeMouseIndicator();
      try {
        chrome.runtime.sendMessage({ type: 'error', error: event.error });
      } catch (error) {
        console.error("Error sending error message:", error);
      }
    };

    recognition.onend = function() {
      console.log("Main speech recognition ended");
      isListening = false;
      removeMouseIndicator(); // Hide mouse indicator when listening stops
      try {
        chrome.runtime.sendMessage({ type: 'recognitionStopped' });
      } catch (error) {
        console.error("Error sending recognition stopped message:", error);
      }
      
      // Restart activation listener after main recognition ends
      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 1000);
    };

    // Activation recognition - always listening for "start listening"
    activationRecognition = new SpeechRecognition();
    activationRecognition.continuous = true;
    activationRecognition.interimResults = false;
    activationRecognition.lang = 'en-US';

    activationRecognition.onstart = function() {
      console.log("Activation listener started");
    };

    activationRecognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Activation heard:", transcript);
      
      if (transcript.includes("start listening") || transcript.includes("hey voice") || transcript.includes("voice mouse")) {
        console.log("Activation phrase detected:", transcript);
        activationRecognition.stop();
        
        // Start main recognition
        try {
          recognition.start();
        } catch (error) {
          console.error("Error starting main recognition:", error);
        }
      }
    };

    activationRecognition.onerror = function(event) {
      console.error("Activation recognition error:", event.error);
      // Restart activation listener on error
      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 2000);
    };

    activationRecognition.onend = function() {
      console.log("Activation recognition ended");
      // Restart activation listener unless main recognition is active
      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 1000);
    };

    console.log("Speech recognition initialized successfully");
    
    // Start activation listener
    startActivationListener();
    
    return true;
  } else {
    console.error("Speech recognition not supported in this browser");
    return false;
  }
}

// Start the activation listener
function startActivationListener() {
  if (!isListening && activationRecognition) {
    try {
      console.log("Starting activation listener...");
      activationRecognition.start();
    } catch (error) {
      console.error("Error starting activation listener:", error);
      // Retry after a delay
      setTimeout(startActivationListener, 3000);
    }
  }
}

function handleCommand(command) {
  console.log("Received command:", command);
  
  const moveDistance = 50; // pixels to move mouse
  
  if (command.includes("scroll down")) {
    window.scrollBy(0, 100);
    console.log("Scrolled down");
  } else if (command.includes("scroll up")) {
    window.scrollBy(0, -100);
    console.log("Scrolled up");
  } else if (command.includes("move up")) {
    mouseY = Math.max(0, mouseY - moveDistance);
    updateMouseIndicator();
    console.log("Moved mouse up");
  } else if (command.includes("move down")) {
    mouseY = Math.min(window.innerHeight, mouseY + moveDistance);
    updateMouseIndicator();
    console.log("Moved mouse down");
  } else if (command.includes("move left")) {
    mouseX = Math.max(0, mouseX - moveDistance);
    updateMouseIndicator();
    console.log("Moved mouse left");
  } else if (command.includes("move right")) {
    mouseX = Math.min(window.innerWidth, mouseX + moveDistance);
    updateMouseIndicator();
    console.log("Moved mouse right");
  } else if (command.includes("click")) {
    const element = document.elementFromPoint(mouseX, mouseY);
    if (element) {
      element.click();
      console.log("Clicked element:", element.tagName, "at", mouseX, mouseY);
      
      // Brief visual feedback for click
      if (mouseIndicator) {
        mouseIndicator.style.background = 'lime';
        setTimeout(() => {
          if (mouseIndicator) mouseIndicator.style.background = 'red';
        }, 200);
      }
    } else {
      console.log("No element found to click at", mouseX, mouseY);
    }
  } else if (command.includes("center mouse")) {
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;
    updateMouseIndicator();
    console.log("Centered mouse");
  } else if (command.includes("stop listening")) {
    // This is handled in onresult before reaching here
    console.log("Stop listening command processed");
  } else {
    console.log("Unknown command:", command);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  
  if (request.action === 'ping') {
    console.log("Responding to ping");
    sendResponse({ success: true, message: "Content script is working!" });
  } else if (request.action === 'checkSupport') {
    console.log("Checking speech recognition support");
    const supported = initSpeechRecognition();
    console.log("Speech recognition supported:", supported);
    sendResponse({ supported: supported });
  } else if (request.action === 'testCircle') {
    console.log("Test circle requested");
    createMouseIndicator();
    sendResponse({ success: true });
  } else if (request.action === 'startRecognition') {
    console.log("Manual start recognition from popup");
    if (activationRecognition) {
      activationRecognition.stop(); // Stop activation listener
    }
    if (recognition && !isListening) {
      try {
        recognition.start();
        console.log("Recognition start attempt successful");
      } catch (error) {
        console.error("Error starting recognition:", error);
        try {
          chrome.runtime.sendMessage({ type: 'error', error: error.message });
        } catch (msgError) {
          console.error("Error sending error message:", msgError);
        }
      }
    } else if (!recognition) {
      console.error("Recognition not initialized");
      try {
        chrome.runtime.sendMessage({ type: 'error', error: 'Recognition not initialized' });
      } catch (msgError) {
        console.error("Error sending error message:", msgError);
      }
    } else if (isListening) {
      console.log("Already listening");
    }
  } else if (request.action === 'stopRecognition') {
    console.log("Manual stop recognition from popup");
    if (recognition && isListening) {
      recognition.stop();
    }
  } else if (request.command) {
    // Legacy support for direct command messages
    console.log("Received direct command:", request.command);
    handleCommand(request.command);
    sendResponse({success: true});
  }
  
  return true; // Keep the message channel open for async response
});

// Initialize when the page loads
console.log("Content script loaded, document ready state:", document.readyState);
console.log("Window location:", window.location.href);

// Add a simple test indicator to verify content script is working
function createTestIndicator() {
  console.log("Creating test indicator");
  const testDiv = document.createElement('div');
  testDiv.id = 'voice-mouse-test';
  testDiv.style.position = 'fixed';
  testDiv.style.top = '10px';
  testDiv.style.right = '10px';
  testDiv.style.width = '100px';
  testDiv.style.height = '30px';
  testDiv.style.background = 'blue';
  testDiv.style.color = 'white';
  testDiv.style.zIndex = '10001';
  testDiv.style.fontSize = '12px';
  testDiv.style.textAlign = 'center';
  testDiv.style.lineHeight = '30px';
  testDiv.style.borderRadius = '5px';
  testDiv.textContent = 'Script Loaded';
  
  if (document.body) {
    document.body.appendChild(testDiv);
    console.log("Test indicator added to page");
  } else {
    console.log("Document body not available");
  }
}

function waitForDocumentReady() {
  if (document.readyState === 'loading') {
    console.log("Document still loading, waiting...");
    document.addEventListener('DOMContentLoaded', function() {
      console.log("DOM Content Loaded, initializing...");
      setTimeout(() => {
        createTestIndicator();
        initSpeechRecognition();
      }, 100);
    });
  } else {
    console.log("Document already ready, initializing immediately...");
    setTimeout(() => {
      createTestIndicator();
      initSpeechRecognition();
    }, 100);
  }
}

waitForDocumentReady();
