let recognition;
let isListening = false;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseIndicator = null;

function createMouseIndicator() {
  if (mouseIndicator) return;
  
  mouseIndicator = document.createElement('div');
  mouseIndicator.style.position = 'fixed';
  mouseIndicator.style.width = '20px';
  mouseIndicator.style.height = '20px';
  mouseIndicator.style.background = 'red';
  mouseIndicator.style.border = '2px solid white';
  mouseIndicator.style.borderRadius = '50%';
  mouseIndicator.style.zIndex = '10000';
  mouseIndicator.style.pointerEvents = 'none';
  mouseIndicator.style.left = (mouseX - 10) + 'px';
  mouseIndicator.style.top = (mouseY - 10) + 'px';
  
  document.body.appendChild(mouseIndicator);
}

function updateMouseIndicator() {
  if (mouseIndicator) {
    mouseIndicator.style.left = (mouseX - 10) + 'px';
    mouseIndicator.style.top = (mouseY - 10) + 'px';
  }
}

function removeMouseIndicator() {
  if (mouseIndicator) {
    document.body.removeChild(mouseIndicator);
    mouseIndicator = null;
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    isListening = true;
    createMouseIndicator();
    chrome.runtime.sendMessage({ type: 'started' });
  };

  recognition.onresult = function(event) {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    chrome.runtime.sendMessage({ type: 'transcript', text: transcript });
    
    if (transcript.includes("stop listening")) {
      recognition.stop();
      return;
    }
    
    handleCommand(transcript);
  };

  recognition.onend = function() {
    isListening = false;
    removeMouseIndicator();
    chrome.runtime.sendMessage({ type: 'stopped' });
  };

  return true;
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
    }
  } else if (command.includes("center")) {
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;
    updateMouseIndicator();
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    if (recognition && !isListening) {
      recognition.start();
    }
  } else if (request.action === 'stop') {
    if (recognition && isListening) {
      recognition.stop();
    }
  }
});

// Initialize when page loads
window.addEventListener('load', function() {
  setTimeout(() => {
    initSpeechRecognition();
  }, 1000);
});
