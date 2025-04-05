// Conductor Module for ART Interface
// This module orchestrates conversations between LLM frames

// Configuration
const conductorConfig = {
  // Active conversation
  activeConversation: null,
  
  // Conversation history
  history: [],
  
  // Frame roles and capabilities
  frames: {
    frame1: { role: "Designer", api: "Grok", capabilities: ["ideation", "planning", "design"] },
    frame2: { role: "Developer", api: "ChatGPT", capabilities: ["coding", "debugging", "documentation"] },
    frame3: { role: "Executor", api: "Executor", capabilities: ["file_creation", "testing", "execution"] },
    frame4: { role: "Conductor", api: "Conductor", capabilities: ["orchestration", "conflict_resolution", "project_management"] }
  },
  
  // Project types and workflows
  projectTypes: {
    webapp: ["design", "frontend", "backend", "testing"],
    module: ["specification", "implementation", "integration", "testing"],
    marketing: ["research", "strategy", "content", "evaluation"]
  }
};

// Initialize the conductor
function initializeConductor() {
  console.log("Initializing Conductor Module...");
  
  // Set up event listeners for all frames
  setupFrameListeners();
  
  // Expose conductor functions to the window
  window.conductor = {
    startProject,
    assignTask,
    resolveConflict,
    reviewProgress,
    getHistory,
    getFrameInfo
  };
  
  console.log("Conductor Module initialized");
  return "Conductor ready. Use window.conductor.startProject() to begin.";
}

// Set up listeners for all frames
function setupFrameListeners() {
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    return;
  }
  
  // Listen for messages to frame4 (Conductor)
  window.electron.ipcRenderer.on('frame-frame4', (msg) => {
    console.log("Conductor received message:", msg);
    
    // Process the message
    processIncomingMessage(msg);
  });
}

// Process incoming messages to the conductor
function processIncomingMessage(msg) {
  // Add to history
  conductorConfig.history.push({
    timestamp: new Date().toISOString(),
    from: msg.sender,
    to: 'frame4',
    content: msg.message,
    type: 'message'
  });
  
  // Check for special commands
  if (msg.message.startsWith('/')) {
    processCommand(msg.message, msg.sender);
    return;
  }
  
  // If there's an active conversation, forward to the appropriate frame
  if (conductorConfig.activeConversation) {
    const { participants } = conductorConfig.activeConversation;
    
    // If the sender is part of the conversation, forward to other participants
    if (participants.includes(msg.sender)) {
      participants.forEach(frameId => {
        if (frameId !== msg.sender && frameId !== 'frame4') {
          sendMessage('frame4', frameId, `[Forwarded from ${conductorConfig.frames[msg.sender].role}]: ${msg.message}`);
        }
      });
    }
  }
}

// Process conductor commands
function processCommand(command, sender) {
  const cmd = command.toLowerCase();
  
  if (cmd.startsWith('/start')) {
    // Extract project type and participants
    const parts = cmd.split(' ');
    if (parts.length >= 2) {
      const projectType = parts[1];
      const participants = parts.slice(2);
      
      startProject(projectType, participants.length > 0 ? participants : ['frame1', 'frame2', 'frame3']);
    } else {
      sendMessage('frame4', sender, "Usage: /start [project-type] [frame1 frame2 ...]");
    }
  }
  else if (cmd.startsWith('/assign')) {
    // Extract task and assignee
    const parts = cmd.split(' ');
    if (parts.length >= 3) {
      const frameId = parts[1];
      const task = parts.slice(2).join(' ');
      
      assignTask(frameId, task);
    } else {
      sendMessage('frame4', sender, "Usage: /assign [frame-id] [task description]");
    }
  }
  else if (cmd.startsWith('/resolve')) {
    // Extract conflict details
    const conflict = cmd.substring(9);
    resolveConflict(conflict);
  }
  else if (cmd.startsWith('/review')) {
    reviewProgress();
  }
  else if (cmd.startsWith('/help')) {
    const helpMessage = `
Available commands:
/start [project-type] [frame1 frame2 ...] - Start a new project
/assign [frame-id] [task] - Assign a task to a frame
/resolve [conflict] - Resolve a conflict
/review - Review project progress
/help - Show this help message
`;
    sendMessage('frame4', sender, helpMessage);
  }
  else {
    sendMessage('frame4', sender, `Unknown command: ${command}. Type /help for available commands.`);
  }
}

// Start a new project
function startProject(projectType, participants = ['frame1', 'frame2', 'frame3']) {
  console.log(`Starting ${projectType} project with participants:`, participants);
  
  // Validate project type
  if (!conductorConfig.projectTypes[projectType]) {
    console.error(`Unknown project type: ${projectType}`);
    return `Unknown project type: ${projectType}. Available types: ${Object.keys(conductorConfig.projectTypes).join(', ')}`;
  }
  
  // Set up the active conversation
  conductorConfig.activeConversation = {
    projectType,
    participants,
    startTime: new Date().toISOString(),
    stages: conductorConfig.projectTypes[projectType],
    currentStage: 0
  };
  
  // Add to history
  conductorConfig.history.push({
    timestamp: new Date().toISOString(),
    type: 'project_start',
    projectType,
    participants
  });
  
  // Notify all participants
  const workflow = conductorConfig.projectTypes[projectType].join(' → ');
  participants.forEach(frameId => {
    const role = conductorConfig.frames[frameId].role;
    sendMessage('frame4', frameId, `
🚀 New ${projectType} project started!
Your role: ${role}
Workflow: ${workflow}
Current stage: ${conductorConfig.projectTypes[projectType][0]}

Please wait for task assignments or collaborate with other frames.
`);
  });
  
  return `Project started: ${projectType} with ${participants.join(', ')}`;
}

// Assign a task to a specific frame
function assignTask(frameId, task) {
  console.log(`Assigning task to ${frameId}: ${task}`);
  
  if (!conductorConfig.frames[frameId]) {
    console.error(`Unknown frame: ${frameId}`);
    return `Unknown frame: ${frameId}`;
  }
  
  // Add to history
  conductorConfig.history.push({
    timestamp: new Date().toISOString(),
    type: 'task_assignment',
    frameId,
    task
  });
  
  // Send the task to the frame
  const role = conductorConfig.frames[frameId].role;
  sendMessage('frame4', frameId, `
📋 Task Assignment
As the ${role}, please:
${task}

When complete, report back to the Conductor (frame4).
`);
  
  return `Task assigned to ${frameId} (${role})`;
}

// Resolve a conflict between frames
function resolveConflict(conflict) {
  console.log(`Resolving conflict: ${conflict}`);
  
  if (!conductorConfig.activeConversation) {
    console.error("No active conversation to resolve conflicts");
    return "No active conversation to resolve conflicts";
  }
  
  // Add to history
  conductorConfig.history.push({
    timestamp: new Date().toISOString(),
    type: 'conflict_resolution',
    conflict
  });
  
  // Notify all participants
  const { participants } = conductorConfig.activeConversation;
  participants.forEach(frameId => {
    sendMessage('frame4', frameId, `
⚠️ Conflict Resolution
Issue: ${conflict}

Please adjust your approach accordingly and coordinate with other frames.
`);
  });
  
  return `Conflict resolution initiated: ${conflict}`;
}

// Review project progress
function reviewProgress() {
  console.log("Reviewing project progress");
  
  if (!conductorConfig.activeConversation) {
    console.error("No active conversation to review");
    return "No active conversation to review";
  }
  
  const { projectType, participants, startTime, stages, currentStage } = conductorConfig.activeConversation;
  
  // Calculate duration
  const startDate = new Date(startTime);
  const duration = Math.floor((new Date() - startDate) / 60000); // in minutes
  
  // Count messages by frame
  const messageCounts = {};
  participants.forEach(frameId => {
    messageCounts[frameId] = 0;
  });
  
  conductorConfig.history.forEach(entry => {
    if (entry.type === 'message' && participants.includes(entry.from)) {
      messageCounts[entry.from] = (messageCounts[entry.from] || 0) + 1;
    }
  });
  
  // Generate progress report
  const progressReport = `
📊 Project Progress Report
Project Type: ${projectType}
Duration: ${duration} minutes
Current Stage: ${stages[currentStage]} (${currentStage + 1}/${stages.length})
Participants: ${participants.map(frameId => conductorConfig.frames[frameId].role).join(', ')}

Activity:
${participants.map(frameId => `- ${conductorConfig.frames[frameId].role}: ${messageCounts[frameId] || 0} messages`).join('\n')}

Next Stage: ${currentStage < stages.length - 1 ? stages[currentStage + 1] : 'Final review'}
`;

  // Add to history
  conductorConfig.history.push({
    timestamp: new Date().toISOString(),
    type: 'progress_review',
    report: progressReport
  });
  
  // Send to all participants
  participants.forEach(frameId => {
    sendMessage('frame4', frameId, progressReport);
  });
  
  return progressReport;
}

// Get conversation history
function getHistory() {
  return conductorConfig.history;
}

// Get information about a frame
function getFrameInfo(frameId) {
  return conductorConfig.frames[frameId] || null;
}

// Send a message from one frame to another
function sendMessage(sourceFrame, targetFrame, message) {
  if (!window.electron?.ipcRenderer) {
    console.error("Electron IPC not available");
    return;
  }
  
  window.electron.ipcRenderer.send('frame-message', {
    target: targetFrame,
    sender: sourceFrame,
    message: message
  });
  
  console.log(`Message sent from ${sourceFrame} to ${targetFrame}`);
}

// Export the initialize function
window.initializeConductor = initializeConductor;

console.log("Conductor Module loaded. Call window.initializeConductor() to start.");
