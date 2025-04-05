// Direct Auto-Conversation Script for ART Interface
// This script directly injects the auto-conversation functionality into the page

// Global configuration
window.config = window.config || {
  // Whether auto-conversation is enabled
  autoConversationEnabled: false,
  
  // Maximum number of exchanges before stopping automatically
  maxExchanges: 10,
  
  // Delay between exchanges (in milliseconds)
  exchangeDelay: 1000,
  
  // Current exchange count
  currentExchanges: 0,
  
  // Conversation history
  conversationHistory: [],
  
  // Frame roles
  frameRoles: {
    frame1: "Designer", // e.g., Grok as designer
    frame2: "Developer", // e.g., ChatGPT as developer
    frame3: "Executor", // Builds the actual code
    frame4: "Conductor" // Orchestrates the conversation
  }
};

// Detect the current frame
function detectCurrentFrame() {
  // Try to find frame ID in the DOM
  const frameElement = document.querySelector('[data-frame-id]');
  if (frameElement && frameElement.dataset.frameId) {
    return frameElement.dataset.frameId;
  }
  
  // If not found, try to infer from the URL
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

// Start automatic conversation between frames
function startAutoConversation(initialPrompt, sourceFrame, targetFrame) {
  if (!initialPrompt || !sourceFrame || !targetFrame) {
    console.error("Missing required parameters for auto conversation");
    return "Error: Missing parameters. Need initialPrompt, sourceFrame, and targetFrame.";
  }
  
  if (sourceFrame === targetFrame) {
    console.error("Source and target frames cannot be the same");
    return "Error: Source and target frames cannot be the same.";
  }
  
  console.log(`Starting auto conversation from ${sourceFrame} to ${targetFrame} with prompt: ${initialPrompt}`);
  
  // Reset conversation state
  window.config.autoConversationEnabled = true;
  window.config.currentExchanges = 0;
  window.config.conversationHistory = [];
  
  // Log the start of conversation to history
  logToHistory(sourceFrame, targetFrame, initialPrompt);
  
  // Send the initial message
  sendMessage(sourceFrame, targetFrame, initialPrompt);
  
  // Show notification
  showNotification(`Auto conversation started: ${sourceFrame} → ${targetFrame}`, 'info');
  
  return "Auto conversation started. Type stopAutoConversation() to end it.";
}

// Stop the automatic conversation
function stopAutoConversation() {
  window.config.autoConversationEnabled = false;
  
  // Show notification
  showNotification(`Auto conversation stopped after ${window.config.currentExchanges} exchanges`, 'warn');
  
  console.log(`Auto conversation stopped after ${window.config.currentExchanges} exchanges`);
  return `Auto conversation stopped after ${window.config.currentExchanges} exchanges`;
}

// Send a message from one frame to another
function sendMessage(sourceFrame, targetFrame, message) {
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    showNotification("Error: Electron IPC not available", 'error');
    return false;
  }
  
  // Add instructions for the executor if the target is frame3
  let instructions = null;
  if (targetFrame === 'frame3' && message.includes('```')) {
    // Extract code blocks and create instructions
    instructions = extractCodeInstructions(message);
  }
  
  // Send the message via IPC
  try {
    console.log(`Sending message from ${sourceFrame} to ${targetFrame}:`, message);
    
    window.electron.ipcRenderer.send('frame-message', {
      target: targetFrame,
      sender: sourceFrame,
      message: message,
      instructions: instructions ? JSON.stringify(instructions) : undefined
    });
    
    // Show notification
    showNotification(`Message sent to ${targetFrame}`, 'info');
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    showNotification(`Error sending message: ${error.message}`, 'error');
    return false;
  }
}

// Extract code blocks from a message and convert to executor instructions
function extractCodeInstructions(message) {
  const instructions = [];
  const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(message)) !== null) {
    const language = match[1] || 'text';
    const code = match[2].trim();
    
    // Determine file extension based on language
    const extension = getFileExtension(language);
    
    // Create a file path
    const timestamp = Date.now();
    const path = `ART/sandbox/auto-conversation/${language}-${timestamp}${extension}`;
    
    // Add instruction to create the file
    instructions.push({
      action: "create_file",
      path: path,
      content: code,
      message: `Created ${language} file from conversation`
    });
    
    // If it's a runnable script, add instruction to test it
    if (['js', 'html'].includes(language)) {
      instructions.push({
        action: "test_script",
        path: path,
        message: `Testing ${language} file`
      });
    }
  }
  
  return instructions;
}

// Get file extension based on language
function getFileExtension(language) {
  const extensionMap = {
    'javascript': '.js',
    'js': '.js',
    'typescript': '.ts',
    'ts': '.ts',
    'html': '.html',
    'css': '.css',
    'python': '.py',
    'py': '.py',
    'json': '.json',
    'markdown': '.md',
    'md': '.md'
  };
  
  return extensionMap[language] || '.txt';
}

// Log conversation to history
function logToHistory(sourceFrame, targetFrame, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    sourceFrame,
    targetFrame,
    message: message.length > 100 ? message.substring(0, 100) + '...' : message
  };
  
  window.config.conversationHistory.push(entry);
  console.log("Added to conversation history:", entry);
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

// Set up a listener for the current frame
function setupAutoResponder() {
  const currentFrame = detectCurrentFrame();
  
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    return false;
  }
  
  try {
    // Set up the listener
    window.electron.ipcRenderer.on(`frame-${currentFrame}`, (msg) => {
      console.log(`Auto-responder received message in ${currentFrame}:`, msg);
      
      // If auto conversation is enabled and we haven't reached the max exchanges
      if (window.config.autoConversationEnabled && window.config.currentExchanges < window.config.maxExchanges) {
        // Increment the exchange counter
        window.config.currentExchanges++;
        
        // Extract sender and message
        const sender = msg.sender || 'unknown';
        const message = msg.message || 'No message content';
        
        // Log to history
        logToHistory(sender, currentFrame, message);
        
        // Wait a bit before responding to make it feel more natural
        setTimeout(() => {
          // Find the chat input and submit button
          const chatInput = document.querySelector('input[placeholder*="message"], textarea[placeholder*="message"]');
          const submitButton = chatInput?.closest('form')?.querySelector('button[type="submit"]');
          
          if (chatInput && submitButton) {
            // Set the input value
            const responsePrompt = `You are in ${currentFrame}. Respond to this message from ${sender}: ${message}`;
            
            // Use the event API to set the value
            const inputEvent = new Event('input', { bubbles: true });
            chatInput.value = responsePrompt;
            chatInput.dispatchEvent(inputEvent);
            
            // Click the submit button
            submitButton.click();
            
            console.log(`Auto-responded in ${currentFrame} to message from ${sender}`);
            
            // After a delay, send the response back
            setTimeout(() => {
              // Find the last assistant message
              const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
              let lastAssistantMessage = null;
              
              for (let i = messages.length - 1; i >= 0; i--) {
                const messageEl = messages[i];
                // Look for elements that might contain the assistant's message
                if (messageEl.textContent && !messageEl.textContent.includes(responsePrompt)) {
                  lastAssistantMessage = messageEl.textContent;
                  break;
                }
              }
              
              if (lastAssistantMessage && window.config.autoConversationEnabled) {
                // Send the response back to the original sender
                sendMessage(currentFrame, sender, lastAssistantMessage);
              }
            }, 5000); // Wait 5 seconds for the response to be generated
          } else {
            console.error("Could not find chat input or submit button");
          }
        }, window.config.exchangeDelay);
      }
    });
    
    console.log(`Auto responder set up for ${currentFrame}`);
    return true;
  } catch (error) {
    console.error("Error setting up auto responder:", error);
    return false;
  }
}

// Initialize
function init() {
  // Set up auto responder
  setupAutoResponder();
  
  // Export functions to window
  window.startAutoConversation = startAutoConversation;
  window.stopAutoConversation = stopAutoConversation;
  window.sendMessage = sendMessage;
  
  console.log("Auto conversation module initialized");
  showNotification("Auto conversation module initialized", 'info');
  
  // Patch the ChatModule buttons to use our functions
  setTimeout(() => {
    patchChatModuleButtons();
  }, 1000);
}

// Patch the ChatModule buttons to use our functions
function patchChatModuleButtons() {
  const currentFrame = detectCurrentFrame();
  
  // Find all buttons with text "Start Auto-Conversation"
  const startButtons = Array.from(document.querySelectorAll('button')).filter(
    button => button.textContent.includes('Start Auto-Conversation')
  );
  
  // Find all buttons with text "Stop"
  const stopButtons = Array.from(document.querySelectorAll('button')).filter(
    button => button.textContent.includes('Stop')
  );
  
  // Patch start buttons
  startButtons.forEach(button => {
    // Remove existing click listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add our click listener
    newButton.addEventListener('click', () => {
      // Find the input and target frame
      const form = newButton.closest('form');
      if (!form) return;
      
      const input = form.querySelector('input');
      const targetSelect = form.querySelector('select');
      
      if (!input || !targetSelect) {
        console.error("Could not find input or target select");
        return;
      }
      
      const initialPrompt = input.value.trim();
      const targetFrame = targetSelect.value;
      
      if (!initialPrompt || !targetFrame) {
        showNotification("Please enter a prompt and select a target frame", 'error');
        return;
      }
      
      // Start auto conversation
      startAutoConversation(initialPrompt, currentFrame, targetFrame);
      
      // Clear the input
      input.value = '';
    });
    
    console.log("Patched Start Auto-Conversation button");
  });
  
  // Patch stop buttons
  stopButtons.forEach(button => {
    // Remove existing click listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add our click listener
    newButton.addEventListener('click', () => {
      stopAutoConversation();
    });
    
    console.log("Patched Stop button");
  });
}

// Run initialization
init();

// Log success
console.log("Direct auto-conversation script loaded successfully");
