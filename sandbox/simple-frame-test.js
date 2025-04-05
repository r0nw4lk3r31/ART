// Simple Frame-to-Frame Communication Test
// This script provides a very basic test for frame-to-frame communication

// Configuration
const config = {
  // Debug mode - logs extra information
  debug: true,
  
  // Current frame ID (will be auto-detected)
  currentFrame: null,
  
  // Target frame ID
  targetFrame: null
};

// Auto-detect the current frame
function detectFrame() {
  // Try to find frame ID in the DOM
  const frameElement = document.querySelector('[data-frame-id]');
  if (frameElement && frameElement.dataset.frameId) {
    config.currentFrame = frameElement.dataset.frameId;
    log(`Detected current frame: ${config.currentFrame}`);
    return config.currentFrame;
  }
  
  // If not found, try to infer from URL or other means
  const url = window.location.href;
  if (url.includes('frame=1') || url.includes('frame1')) {
    config.currentFrame = 'frame1';
  } else if (url.includes('frame=2') || url.includes('frame2')) {
    config.currentFrame = 'frame2';
  } else if (url.includes('frame=3') || url.includes('frame3')) {
    config.currentFrame = 'frame3';
  } else if (url.includes('frame=4') || url.includes('frame4')) {
    config.currentFrame = 'frame4';
  } else {
    // Default to frame1
    config.currentFrame = 'frame1';
    log('Could not detect frame ID, defaulting to frame1', 'warn');
  }
  
  log(`Using frame ID: ${config.currentFrame}`);
  return config.currentFrame;
}

// Set the target frame (different from current frame)
function setTargetFrame(frameId) {
  if (frameId === config.currentFrame) {
    log('Cannot set target frame to current frame', 'error');
    return false;
  }
  
  config.targetFrame = frameId;
  log(`Target frame set to: ${config.targetFrame}`);
  return true;
}

// Send a message to the target frame
function sendMessage(message) {
  if (!config.targetFrame) {
    log('No target frame set. Use setTargetFrame() first.', 'error');
    return false;
  }
  
  if (!window.electron?.ipcRenderer) {
    log('Electron IPC not available', 'error');
    return false;
  }
  
  try {
    const payload = {
      sender: config.currentFrame,
      target: config.targetFrame,
      message: message || `Test message from ${config.currentFrame} at ${new Date().toISOString()}`
    };
    
    log(`Sending message to ${config.targetFrame}:`, 'info', payload);
    
    window.electron.ipcRenderer.send('frame-message', payload);
    return true;
  } catch (error) {
    log(`Error sending message: ${error.message}`, 'error');
    return false;
  }
}

// Set up a listener for incoming messages
function listenForMessages() {
  if (!config.currentFrame) {
    detectFrame();
  }
  
  if (!window.electron?.ipcRenderer) {
    log('Electron IPC not available', 'error');
    return false;
  }
  
  try {
    // Remove any existing listeners to avoid duplicates
    window.electron.ipcRenderer.removeAllListeners(`frame-${config.currentFrame}`);
    
    // Set up the listener
    window.electron.ipcRenderer.on(`frame-${config.currentFrame}`, (msg) => {
      log(`Received message:`, 'success', msg);
      
      // Display a notification
      showNotification(`Message from ${msg.sender}: ${msg.message}`);
    });
    
    log(`Listening for messages on frame-${config.currentFrame}`);
    return true;
  } catch (error) {
    log(`Error setting up listener: ${error.message}`, 'error');
    return false;
  }
}

// Show a notification
function showNotification(message, type = 'success') {
  const colors = {
    success: 'rgba(0, 128, 0, 0.8)',
    error: 'rgba(220, 53, 69, 0.8)',
    info: 'rgba(13, 110, 253, 0.8)',
    warn: 'rgba(255, 193, 7, 0.8)'
  };
  
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = colors[type] || colors.info;
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.maxWidth = '300px';
  notification.style.wordBreak = 'break-word';
  notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  notification.innerHTML = message;
  
  document.body.appendChild(notification);
  
  // Remove the notification after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    
    // Remove from DOM after fade out
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
}

// Logging function
function log(message, level = 'info', data = null) {
  if (!config.debug && level !== 'error') return;
  
  const styles = {
    info: 'color: #0d6efd; font-weight: bold',
    success: 'color: #198754; font-weight: bold',
    warn: 'color: #ffc107; font-weight: bold',
    error: 'color: #dc3545; font-weight: bold'
  };
  
  console.log(`%c[${level.toUpperCase()}] ${message}`, styles[level] || styles.info);
  
  if (data) {
    console.log(data);
  }
}

// Create a simple UI for testing
function createTestUI() {
  // Create container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  container.style.color = 'white';
  container.style.padding = '15px';
  container.style.borderRadius = '5px';
  container.style.zIndex = '9999';
  container.style.width = '300px';
  container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  
  // Add title
  const title = document.createElement('div');
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.fontSize = '14px';
  title.textContent = `Frame Communication Test (${config.currentFrame})`;
  container.appendChild(title);
  
  // Add target frame selector
  const targetLabel = document.createElement('div');
  targetLabel.style.fontSize = '12px';
  targetLabel.style.marginBottom = '5px';
  targetLabel.textContent = 'Target Frame:';
  container.appendChild(targetLabel);
  
  const targetSelect = document.createElement('select');
  targetSelect.style.width = '100%';
  targetSelect.style.marginBottom = '10px';
  targetSelect.style.padding = '5px';
  targetSelect.style.backgroundColor = '#333';
  targetSelect.style.color = 'white';
  targetSelect.style.border = '1px solid #555';
  targetSelect.style.borderRadius = '3px';
  
  // Add options for all frames except current
  ['frame1', 'frame2', 'frame3', 'frame4'].forEach(frameId => {
    if (frameId !== config.currentFrame) {
      const option = document.createElement('option');
      option.value = frameId;
      option.textContent = frameId;
      targetSelect.appendChild(option);
    }
  });
  
  targetSelect.addEventListener('change', () => {
    setTargetFrame(targetSelect.value);
  });
  container.appendChild(targetSelect);
  
  // Set initial target frame
  if (targetSelect.options.length > 0) {
    setTargetFrame(targetSelect.options[0].value);
  }
  
  // Add message input
  const messageLabel = document.createElement('div');
  messageLabel.style.fontSize = '12px';
  messageLabel.style.marginBottom = '5px';
  messageLabel.textContent = 'Message:';
  container.appendChild(messageLabel);
  
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.style.width = '100%';
  messageInput.style.marginBottom = '10px';
  messageInput.style.padding = '5px';
  messageInput.style.backgroundColor = '#333';
  messageInput.style.color = 'white';
  messageInput.style.border = '1px solid #555';
  messageInput.style.borderRadius = '3px';
  messageInput.placeholder = 'Enter message...';
  container.appendChild(messageInput);
  
  // Add send button
  const sendButton = document.createElement('button');
  sendButton.style.width = '100%';
  sendButton.style.padding = '8px';
  sendButton.style.backgroundColor = '#0d6efd';
  sendButton.style.color = 'white';
  sendButton.style.border = 'none';
  sendButton.style.borderRadius = '3px';
  sendButton.style.cursor = 'pointer';
  sendButton.textContent = 'Send Message';
  sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim() || `Test message from ${config.currentFrame}`;
    if (sendMessage(message)) {
      messageInput.value = '';
      showNotification(`Message sent to ${config.targetFrame}`, 'info');
    }
  });
  container.appendChild(sendButton);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    container.remove();
  });
  container.appendChild(closeButton);
  
  // Add to document
  document.body.appendChild(container);
}

// Initialize the test
function init() {
  detectFrame();
  listenForMessages();
  createTestUI();
  
  log('Frame communication test initialized');
  showNotification(`Frame communication test initialized in ${config.currentFrame}`, 'info');
  
  return {
    sendMessage,
    setTargetFrame,
    getConfig: () => ({ ...config })
  };
}

// Export functions to window
window.frameTest = init();
