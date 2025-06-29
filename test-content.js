// Simple test content script
console.log("TEST CONTENT SCRIPT LOADED!");

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Test content script received message:", request);
  
  if (request.action === 'ping') {
    console.log("Responding to ping");
    sendResponse({ success: true, message: "Content script is working!" });
  } else if (request.action === 'testCircle') {
    console.log("Creating test circle");
    createTestCircle();
    sendResponse({ success: true, message: "Test circle created" });
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

// Create a very simple test element
setTimeout(() => {
  if (document.body) {
    const testDiv = document.createElement('div');
    testDiv.textContent = 'EXTENSION WORKING';
    testDiv.style.position = 'fixed';
    testDiv.style.top = '0px';
    testDiv.style.left = '0px';
    testDiv.style.background = 'red';
    testDiv.style.color = 'white';
    testDiv.style.padding = '10px';
    testDiv.style.zIndex = '99999';
    testDiv.style.fontSize = '16px';
    testDiv.style.fontWeight = 'bold';
    document.body.appendChild(testDiv);
    console.log("Test div added to page");
  } else {
    console.log("No document.body available");
  }
}, 1000);
