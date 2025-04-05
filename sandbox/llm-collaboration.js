// LLM Collaboration Module
// This script enables automatic back-and-forth conversation between LLM frames

// Configuration
const config = {
  // Set to true to enable automatic conversation
  autoConversationEnabled: false,
  
  // Maximum number of exchanges before stopping automatically
  maxExchanges: 10,
  
  // Delay between exchanges (in milliseconds)
  exchangeDelay: 1000,
  
  // Current exchange count
  currentExchanges: 0,
  
  // Track conversation history
  conversationHistory: [],
  
  // Frame roles
  frameRoles: {
    frame1: "Designer", // e.g., Grok as designer
    frame2: "Developer", // e.g., ChatGPT as developer
    frame3: "Executor", // Builds the actual code
    frame4: "Conductor" // Orchestrates the conversation
  }
};

// Start automatic conversation between frames
function startAutoConversation(initialPrompt, sourceFrame, targetFrame) {
  if (!initialPrompt || !sourceFrame || !targetFrame) {
    console.error("Missing required parameters for auto conversation");
    return;
  }
  
  config.autoConversationEnabled = true;
  config.currentExchanges = 0;
  config.conversationHistory = [];
  
  // Log the start of conversation to history
  logToHistory(sourceFrame, targetFrame, initialPrompt);
  
  // Send the initial message
  sendMessage(sourceFrame, targetFrame, initialPrompt);
  
  console.log(`Auto conversation started: ${sourceFrame} → ${targetFrame}`);
  return "Auto conversation started. Type stopConversation() to end it.";
}

// Stop the automatic conversation
function stopAutoConversation() {
  config.autoConversationEnabled = false;
  console.log(`Auto conversation stopped after ${config.currentExchanges} exchanges`);
  return `Auto conversation stopped after ${config.currentExchanges} exchanges`;
}

// Send a message from one frame to another
function sendMessage(sourceFrame, targetFrame, message) {
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    return;
  }
  
  // Add instructions for the executor if the target is frame3
  let instructions = null;
  if (targetFrame === 'frame3' && message.includes('```')) {
    // Extract code blocks and create instructions
    instructions = extractCodeInstructions(message);
  }
  
  // Send the message via IPC
  window.electron.ipcRenderer.send('frame-message', {
    target: targetFrame,
    sender: sourceFrame,
    message: message,
    instructions: instructions ? JSON.stringify(instructions) : undefined
  });
  
  console.log(`Message sent from ${sourceFrame} to ${targetFrame}`);
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

// Log conversation to history and update agenda.json
function logToHistory(sourceFrame, targetFrame, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    sourceFrame,
    targetFrame,
    message: message.length > 100 ? message.substring(0, 100) + '...' : message
  };
  
  config.conversationHistory.push(entry);
  
  // If we have window.electronAPI, update the agenda
  if (window.electronAPI) {
    window.electronAPI.loadAgenda()
      .then(agenda => {
        // Add conversation entry to agenda
        const agendaEntry = {
          id: Date.now().toString(),
          title: `${config.frameRoles[sourceFrame]} to ${config.frameRoles[targetFrame]}`,
          description: entry.message,
          date: new Date().toISOString(),
          completed: false,
          type: 'conversation'
        };
        
        agenda.push(agendaEntry);
        return window.electronAPI.saveAgenda(agenda);
      })
      .catch(err => console.error('Error updating agenda:', err));
  }
}

// Listen for messages on a specific frame and auto-respond if enabled
function setupAutoResponder(frameId, apiName) {
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    return;
  }
  
  // Remove any existing listeners to avoid duplicates
  window.electron.ipcRenderer.removeAllListeners(`frame-${frameId}`);
  
  // Set up the listener
  window.electron.ipcRenderer.on(`frame-${frameId}`, (msg) => {
    console.log(`Received message on ${frameId}:`, msg);
    
    // If auto conversation is enabled and we haven't reached the max exchanges
    if (config.autoConversationEnabled && config.currentExchanges < config.maxExchanges) {
      // Increment the exchange counter
      config.currentExchanges++;
      
      // Log to history
      logToHistory(msg.sender, frameId, msg.message);
      
      // Wait a bit before responding to make it feel more natural
      setTimeout(() => {
        // Find the chat module's processCommand function
        const chatModule = findChatModule();
        if (chatModule && chatModule.processCommand) {
          // Process the command to generate a response
          chatModule.processCommand(`You are the ${config.frameRoles[frameId]}. Respond to this message from the ${config.frameRoles[msg.sender]}: ${msg.message}`)
            .then(response => {
              // After processing, send the response back to the original sender
              if (response) {
                sendMessage(frameId, msg.sender, response);
              }
            });
        }
      }, config.exchangeDelay);
    }
  });
  
  console.log(`Auto responder set up for ${frameId} using ${apiName}`);
}

// Find the chat module in the current frame
function findChatModule() {
  // This is a placeholder - in a real implementation, you would need to
  // find a way to access the chat module's processCommand function
  // This might involve exposing it globally or using a different approach
  
  // For now, we'll return null to indicate it's not implemented
  return null;
}

// Export functions to make them available in the console
window.startAutoConversation = startAutoConversation;
window.stopAutoConversation = stopAutoConversation;
window.sendMessage = sendMessage;
window.setupAutoResponder = setupAutoResponder;

console.log("LLM Collaboration Module loaded. Available functions:");
console.log("- startAutoConversation(initialPrompt, sourceFrame, targetFrame)");
console.log("- stopAutoConversation()");
console.log("- sendMessage(sourceFrame, targetFrame, message)");
console.log("- setupAutoResponder(frameId, apiName)");
