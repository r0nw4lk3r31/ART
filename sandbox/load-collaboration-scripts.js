// Load Collaboration Scripts for ART Interface
// This script loads all the necessary scripts for LLM collaboration

// Configuration
const config = {
  // Debug mode - logs extra information
  debug: true,
  
  // Scripts to load
  scripts: [
    '/sandbox/simple-frame-test.js',
    '/sandbox/auto-conversation.js'
  ],
  
  // Auto-start options
  autoStart: {
    enabled: false,
    delay: 2000,
    sourceFrame: null, // Will be auto-detected
    targetFrame: null, // Will be set to a different frame
    initialPrompt: "Let's discuss a marketing strategy for nano tech"
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

// Load a script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log(`Loaded script: ${src}`);
      resolve(script);
    };
    script.onerror = (error) => {
      console.error(`Error loading script ${src}:`, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
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

// Auto-start conversation
function autoStartConversation() {
  if (!config.autoStart.enabled) return;
  
  setTimeout(() => {
    // Make sure we have the startAutoConversation function
    if (typeof window.startAutoConversation !== 'function') {
      console.error("startAutoConversation function not available");
      showNotification("Error: Auto-conversation function not available", 'error');
      return;
    }
    
    // Detect current frame if not set
    if (!config.autoStart.sourceFrame) {
      config.autoStart.sourceFrame = detectCurrentFrame();
    }
    
    // Set target frame (different from source)
    if (!config.autoStart.targetFrame) {
      const frames = ['frame1', 'frame2', 'frame3', 'frame4'];
      const otherFrames = frames.filter(f => f !== config.autoStart.sourceFrame);
      config.autoStart.targetFrame = otherFrames[0] || 'frame2';
    }
    
    // Start the conversation
    window.startAutoConversation(
      config.autoStart.initialPrompt,
      config.autoStart.sourceFrame,
      config.autoStart.targetFrame
    );
    
    console.log("Auto-started conversation:", {
      sourceFrame: config.autoStart.sourceFrame,
      targetFrame: config.autoStart.targetFrame,
      prompt: config.autoStart.initialPrompt
    });
  }, config.autoStart.delay);
}

// Initialize
async function init() {
  try {
    // Load all scripts
    for (const scriptSrc of config.scripts) {
      await loadScript(scriptSrc);
    }
    
    // Auto-start conversation if enabled
    autoStartConversation();
    
    // Show success notification
    showNotification("LLM Collaboration scripts loaded successfully", 'success');
    
    return true;
  } catch (error) {
    console.error("Error initializing collaboration scripts:", error);
    showNotification(`Error loading collaboration scripts: ${error.message}`, 'error');
    return false;
  }
}

// Run initialization
init().then(success => {
  console.log(`Collaboration scripts ${success ? 'loaded successfully' : 'failed to load'}`);
});

// Export configuration
window.collaborationConfig = config;
