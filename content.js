let isListening = false;
let isActivelyListening = false;
let recognition = new webkitSpeechRecognition();
let cursor = document.createElement("div");
let transcript = [];

cursor.style.cssText = `
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #4a90e2, #64a6f7);
  border: 2px solid #80b6ff;
  border-radius: 50%;
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 9999;
  display: none;
  box-shadow: 0 0 20px rgba(100, 166, 247, 0.8), 0 0 40px rgba(100, 166, 247, 0.4);
  animation: spaceCursor 2s ease-in-out infinite;
`;
const style = document.createElement('style');
style.textContent = `
  @keyframes spaceCursor {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 0 20px rgba(100, 166, 247, 0.8), 0 0 40px rgba(100, 166, 247, 0.4);
    }
    50% { 
      transform: scale(1.1);
      box-shadow: 0 0 25px rgba(100, 166, 247, 1), 0 0 50px rgba(100, 166, 247, 0.6);
    }
  }
`;
document.head.appendChild(style);
document.body.appendChild(cursor);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function moveCursor(x, y) {
  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
}

function handleCommand(command) {
  command = command.toLowerCase();
  if (command.includes("start listening")) {
    startActiveListening();
    return;
  } else if (command.includes("stop listening")) {
    stopActiveListening();
    return;
  }
  if (!isActivelyListening) return;

  if (command.includes("move up")) mouseY -= 20;
  if (command.includes("move down")) mouseY += 20;
  if (command.includes("move left")) mouseX -= 20;
  if (command.includes("move right")) mouseX += 20;

  if (command.includes("click")) {
    let el = document.elementFromPoint(mouseX, mouseY);
    el.click();
  }

  if (command.includes("scroll up")) window.scrollBy(0, -100);
  if (command.includes("scroll down")) window.scrollBy(0, 100);

  moveCursor(mouseX, mouseY);
  showTranscript(command);
}

function showTranscript(text) {
  if (!isActivelyListening) return;
  
  transcript.push({ text, time: Date.now() });
  if (transcript.length > 20) transcript.shift();

  chrome.runtime.sendMessage({ action: "transcriptUpdate", command: text });

  let note = document.getElementById("voice-note");
  if (note) note.remove();

  let div = document.createElement("div");
  div.id = "voice-note";
  div.textContent = `"${text}"`;
  div.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
    color: #e8f4ff;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9998;
    border: 2px solid #4a90e2;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3), 0 0 20px rgba(100, 166, 247, 0.2);
    backdrop-filter: blur(10px);
    font-family: 'Segoe UI', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    animation: slideInSpace 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  if (!document.getElementById('voice-note-styles')) {
    const notificationStyle = document.createElement('style');
    notificationStyle.id = 'voice-note-styles';
    notificationStyle.textContent = `
      @keyframes slideInSpace {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(notificationStyle);
  }
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 2000);
}

recognition.continuous = true;
recognition.lang = "en-US";

recognition.onresult = (event) => {
  let result = event.results[event.results.length - 1][0].transcript.trim();
  handleCommand(result);
};

recognition.onerror = () => {
  setTimeout(() => recognition.start(), 100);
};

recognition.onend = () => {
  setTimeout(() => recognition.start(), 100);
};

function startActiveListening() {
  if (!isActivelyListening) {
    isActivelyListening = true;
    isListening = true; 
    cursor.style.display = "block";
    showStartNotification();
  }
}

function stopActiveListening() {
  if (isActivelyListening) {
    isActivelyListening = false;
    isListening = false; 
    cursor.style.display = "none";
    
    showStopNotification();
  }
}

function showStartNotification() {
  let note = document.getElementById("voice-note");
  if (note) note.remove();

  let div = document.createElement("div");
  div.id = "voice-note";
  div.textContent = "Voice control activated";
  div.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
    color: #80b6ff;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9998;
    border: 2px solid #80b6ff;
    box-shadow: 0 4px 15px rgba(128, 182, 255, 0.3), 0 0 20px rgba(128, 182, 255, 0.2);
    backdrop-filter: blur(10px);
    font-family: 'Segoe UI', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    animation: slideInSpace 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  if (!document.getElementById('voice-note-styles')) {
    const notificationStyle = document.createElement('style');
    notificationStyle.id = 'voice-note-styles';
    notificationStyle.textContent = `
      @keyframes slideInSpace {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(notificationStyle);
  }
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

function showStopNotification() {
  let note = document.getElementById("voice-note");
  if (note) note.remove();

  let div = document.createElement("div");
  div.id = "voice-note";
  div.textContent = "Voice control deactivated";
  div.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
    color: #64a6f7;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9998;
    border: 2px solid #4a90e2;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3), 0 0 20px rgba(100, 166, 247, 0.2);
    backdrop-filter: blur(10px);
    font-family: 'Segoe UI', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    animation: slideInSpace 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

recognition.start();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startListening") startActiveListening();
  if (msg.action === "stopListening") stopActiveListening();
  if (msg.action === "getStatus") sendResponse({ isListening: isActivelyListening });
  if (msg.action === "getTranscript") sendResponse({ transcript });
  if (msg.action === "clearTranscript") {
    transcript = [];
    sendResponse({ success: true });
  }
});
