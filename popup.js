const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const statusDiv = document.getElementById("status");
const transcriptDiv = document.getElementById("transcript");

function updateStatus(listening) {
  statusDiv.textContent = listening ? "🎤 Listening..." : "Not Listening";
}

function updateTranscript(entries) {
  transcriptDiv.innerHTML = "";
  entries.forEach(entry => {
    const line = document.createElement("div");
    line.textContent = `"${entry.text}"`;
    transcriptDiv.appendChild(line);
  });
}

startBtn.onclick = () => {
  sendToTab({ action: "startListening" });
  updateStatus(true);
};

stopBtn.onclick = () => {
  sendToTab({ action: "stopListening" });
  updateStatus(false);
};

clearBtn.onclick = () => {
  sendToTab({ action: "clearTranscript" });
  transcriptDiv.textContent = "Say something...";
};

function sendToTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, msg);
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "transcriptUpdate") {
    const line = document.createElement("div");
    line.textContent = `"${msg.command}"`;
    transcriptDiv.appendChild(line);
    transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, { action: "getStatus" }, res => {
    if (res) updateStatus(res.isListening);
  });
  chrome.tabs.sendMessage(tabs[0].id, { action: "getTranscript" }, res => {
    if (res && res.transcript) updateTranscript(res.transcript);
  });
});
