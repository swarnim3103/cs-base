const toggleBtn = document.getElementById("toggleBtn");
const clearBtn = document.getElementById("clearBtn");
const statusDiv = document.getElementById("status");
const transcriptDiv = document.getElementById("transcript");

let isListening = false;

function updateStatus(listening) {
  isListening = listening;
  statusDiv.textContent = listening ? "Listening..." : "Not Listening";
  statusDiv.className = listening ? "listening" : "";
  toggleBtn.textContent = listening ? "Stop Listening" : "Start Listening";
  toggleBtn.className = listening ? "listening" : "";
}

function updateTranscript(entries) {
  transcriptDiv.innerHTML = "";
  entries.forEach(entry => {
    const line = document.createElement("div");
    line.textContent = `"${entry.text}"`;
    transcriptDiv.appendChild(line);
  });
}

toggleBtn.onclick = () => {
  if (isListening) {
    sendToTab({ action: "stopListening" });
    updateStatus(false);
  } else {
    sendToTab({ action: "startListening" });
    updateStatus(true);
  }
};

clearBtn.onclick = () => {
  sendToTab({ action: "clearTranscript" });
  transcriptDiv.innerHTML = "";
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
