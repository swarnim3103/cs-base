let recognition;
let activationRecognition; 
let isListening = false;
let mouseX = window.innerWidth / 2;  
let mouseY = window.innerHeight / 2;
let mouseIndicator = null;

function createMouseIndicator() {
  if (mouseIndicator) {
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
  } catch (error) {
    console.error("Error creating mouse indicator:", error);
  }
}
function updateMouseIndicator() {
  if (mouseIndicator) {
    mouseIndicator.style.left = (mouseX - 10) + 'px';
    mouseIndicator.style.top = (mouseY - 10) + 'px';
  }
}

function removeMouseIndicator() {
  if (mouseIndicator && document.body) {
    try {
      document.body.removeChild(mouseIndicator);
      mouseIndicator = null;
    } catch (error) {
      console.error("Error removing mouse indicator:", error);
      mouseIndicator = null;
    }
  }
}

function initSpeechRecognition() {
  
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {

      isListening = true;
      createMouseIndicator(); 
      try {
        chrome.runtime.sendMessage({ type: 'recognitionStarted' });
      } catch (error) {
        console.error("Error sending recognition started message:", error);
      }
    };

    recognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    
      try {
        chrome.runtime.sendMessage({ type: 'transcript', transcript: transcript });
      } catch (error) {
        console.error("Error sending transcript:", error);
      }
      if (transcript.includes("stop listening")) {

        try {
          chrome.runtime.sendMessage({ type: 'transcript', transcript: transcript + " (stopping...)" });
        } catch (error) {
          console.error("Error sending stop message:", error);
        }
        recognition.stop();
        return;
      }
      handleCommand(transcript);
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

      isListening = false;
      try {
        chrome.runtime.sendMessage({ type: 'recognitionStopped' });
      } catch (error) {
        console.error("Error sending recognition stopped message:", error);
      }
      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 1000);
    };
    activationRecognition = new SpeechRecognition();
    activationRecognition.continuous = true;
    activationRecognition.interimResults = false;
    activationRecognition.lang = 'en-US';

    activationRecognition.onstart = function() {

    };

    activationRecognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

      
      if (transcript.includes("start listening") || transcript.includes("hey voice") || transcript.includes("voice mouse")) {
        activationRecognition.stop();
        
        try {
          recognition.start();
        } catch (error) {
          console.error("Error starting main recognition:", error);
        }
      }
    };

    activationRecognition.onerror = function(event) {
      console.error("Activation recognition error:", event.error);
      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 2000);
    };

    activationRecognition.onend = function() {

      setTimeout(() => {
        if (!isListening) {
          startActivationListener();
        }
      }, 1000);
    };


    startActivationListener();
    
    return true;
  } else {
    console.error("Speech recognition not supported in this browser");
    return false;
  }
}

function startActivationListener() {
  if (!isListening && activationRecognition) {
    try {

      activationRecognition.start();
    } catch (error) {
      console.error("Error starting activation listener:", error);
      setTimeout(startActivationListener, 3000);
    }
  }
}

function handleCommand(command) {
  
  const moveDistance = 50; 
  
  if (command.includes("scroll down")) {
    window.scrollBy(0, 100);

  } else if (command.includes("scroll up")) {
    window.scrollBy(0, -100);
  } else if (command.includes("move up")) {
    mouseY = Math.max(0, mouseY - moveDistance);
    updateMouseIndicator();
  } else if (command.includes("move down")) {
    mouseY = Math.min(window.innerHeight, mouseY + moveDistance);
    updateMouseIndicator();
  } else if (command.includes("move left")) {
    mouseX = Math.max(0, mouseX - moveDistance);
    updateMouseIndicator();
  } else if (command.includes("move right")) {
    mouseX = Math.min(window.innerWidth, mouseX + moveDistance);
    updateMouseIndicator();
  } else if (command.includes("click")) {
    const element = document.elementFromPoint(mouseX, mouseY);
    if (element) {
      element.click();
      if (mouseIndicator) {
        mouseIndicator.style.background = 'lime';
        setTimeout(() => {
          if (mouseIndicator) mouseIndicator.style.background = 'red';
        }, 200);
      }
    }
  } else if (command.includes("center mouse")) {
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;
    updateMouseIndicator();
  } else if (command.includes("stop listening")) {
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  
  if (request.action === 'ping') {

    sendResponse({ success: true, message: "Content script is working!" });
  } else if (request.action === 'checkSupport') {

    const supported = initSpeechRecognition();
 
    sendResponse({ supported: supported });
  } else if (request.action === 'testCircle') {
    createMouseIndicator();
    sendResponse({ success: true });
  } else if (request.action === 'startRecognition') {
    if (activationRecognition) {
      activationRecognition.stop(); 
    }
    if (recognition && !isListening) {
      try {
        recognition.start();
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
    }
  } else if (request.action === 'stopRecognition') {
    if (recognition && isListening) {
      recognition.stop();
    }
  } else if (request.command) {
    handleCommand(request.command);
    sendResponse({success: true});
  }
  
  return true; 
});
function createTestIndicator() {
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
  } 
}

function waitForDocumentReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        createTestIndicator();
        initSpeechRecognition();
      }, 100);
    });
  } else {
    setTimeout(() => {
      createTestIndicator();
      initSpeechRecognition();
    }, 100);
  }
}

waitForDocumentReady();
