let isListening = false;
let recognition = new webkitSpeechRecognition();
let cursor = document.createElement("div");
let transcript = [];

cursor.style.cssText = `
  width: 20px;
  height: 20px;
  background: red;
  border-radius: 50%;
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 9999;
  display: none;
`;
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
    startListening();
  } else if (command.includes("stop listening")) {
    stopListening();
  }

  if (!isListening) return;

  if (command.includes("move up")) mouseY -= 20;
  if (command.includes("move down")) mouseY += 20;
  if (command.includes("move left")) mouseX -= 20;
  if (command.includes("move right")) mouseX += 20;

  if (command.includes("click")) {
    let el = document.elementFromPoint(mouseX, mouseY);
    el?.click();
  }

  if (command.includes("scroll up")) window.scrollBy(0, -100);
  if (command.includes("scroll down")) window.scrollBy(0, 100);

  moveCursor(mouseX, mouseY);
  showTranscript(command);
}

function showTranscript(text) {
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
    background: black;
    color: lime;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    z-index: 9998;
  `;
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
  if (isListening) recognition.start();
};

recognition.onend = () => {
  if (isListening) recognition.start();
};

function startListening() {
  if (!isListening) {
    isListening = true;
    recognition.start();
    cursor.style.display = "block";
  }
}

function stopListening() {
  isListening = false;
  recognition.stop();
  cursor.style.display = "none";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startListening") startListening();
  if (msg.action === "stopListening") stopListening();
  if (msg.action === "getStatus") sendResponse({ isListening });
  if (msg.action === "getTranscript") sendResponse({ transcript });
  if (msg.action === "clearTranscript") {
    transcript = [];
    sendResponse({ success: true });
  }
});
