// Test script for frame-to-frame communication
// This script will help test if the communication between frames is working properly

// Function to test sending a message from one frame to another
function testFrameCommunication(sourceFrame, targetFrame, message) {
  console.log(`Testing communication from ${sourceFrame} to ${targetFrame}`);
  
  // Check if electron is available
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available. Make sure you're running in the Electron app.");
    return false;
  }
  
  try {
    // Send the message
    window.electron.ipcRenderer.send('frame-message', {
      target: targetFrame,
      sender: sourceFrame,
      message: message || `Test message from ${sourceFrame} to ${targetFrame} at ${new Date().toISOString()}`
    });
    
    console.log("Message sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}

// Function to set up a listener for a specific frame
function setupFrameListener(frameId) {
  console.log(`Setting up listener for frame-${frameId}`);
  
  // Check if electron is available
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available. Make sure you're running in the Electron app.");
    return false;
  }
  
  try {
    // Remove any existing listeners to avoid duplicates
    window.electron.ipcRenderer.removeAllListeners(`frame-${frameId}`);
    
    // Set up the listener
    window.electron.ipcRenderer.on(`frame-${frameId}`, (msg) => {
      console.log(`%cReceived message on frame-${frameId}:`, 'color: green; font-weight: bold', msg);
      
      // Display a notification
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '9999';
      notification.style.maxWidth = '300px';
      notification.style.wordBreak = 'break-word';
      notification.innerHTML = `
        <div><strong>Message Received!</strong></div>
        <div>From: ${msg.sender}</div>
        <div>Message: ${msg.message}</div>
      `;
      
      document.body.appendChild(notification);
      
      // Remove the notification after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    });
    
    console.log(`Listener for frame-${frameId} set up successfully`);
    return true;
  } catch (error) {
    console.error("Error setting up listener:", error);
    return false;
  }
}

// Function to detect which frame we're in
function detectCurrentFrame() {
  // Look for frame ID in the DOM
  const frameElement = document.querySelector('[data-frame-id]');
  if (frameElement) {
    return frameElement.dataset.frameId;
  }
  
  // If not found in the DOM, try to infer from the URL
  const url = window.location.href;
  if (url.includes('frame=1') || url.includes('frame1')) {
    return 'frame1';
  } else if (url.includes('frame=2') || url.includes('frame2')) {
    return 'frame2';
  } else if (url.includes('frame=3') || url.includes('frame3')) {
    return 'frame3';
  } else if (url.includes('frame=4') || url.includes('frame4')) {
    return 'frame4';
  }
  
  // Default to frame1 if we can't detect
  console.warn("Could not detect frame ID, defaulting to frame1");
  return 'frame1';
}

// Function to run a complete test
function runCommunicationTest() {
  const currentFrame = detectCurrentFrame();
  console.log(`Detected current frame: ${currentFrame}`);
  
  // Set up listener for the current frame
  const listenerSetup = setupFrameListener(currentFrame);
  if (!listenerSetup) {
    console.error("Failed to set up listener. Test aborted.");
    return;
  }
  
  // Determine target frame (different from current frame)
  let targetFrame;
  if (currentFrame === 'frame1') {
    targetFrame = 'frame2';
  } else {
    targetFrame = 'frame1';
  }
  
  // Show instructions to the user
  console.log(`%cTest Instructions:`, 'color: blue; font-weight: bold');
  console.log(`1. Run this script in ${currentFrame}`);
  console.log(`2. Run the same script in ${targetFrame}`);
  console.log(`3. Then run testFrameCommunication('${currentFrame}', '${targetFrame}', 'Hello from ${currentFrame}!') in this frame`);
  console.log(`4. You should see a notification appear in ${targetFrame}`);
  
  return {
    currentFrame,
    targetFrame,
    sendTestMessage: () => testFrameCommunication(currentFrame, targetFrame, `Hello from ${currentFrame}!`)
  };
}

// Export functions to the global scope
window.testFrameCommunication = testFrameCommunication;
window.setupFrameListener = setupFrameListener;
window.detectCurrentFrame = detectCurrentFrame;
window.runCommunicationTest = runCommunicationTest;

// Run the test automatically
const test = runCommunicationTest();
console.log(`%cReady to test communication from ${test.currentFrame} to ${test.targetFrame}`, 'color: blue; font-weight: bold');
console.log(`To send a test message, run: test.sendTestMessage()`);
