// Minimal Auto-Conversation Script for ART Interface
// This script provides the bare minimum functionality for auto-conversation

console.log("Loading minimal auto-conversation script...");

// Define the startAutoConversation function
function startAutoConversation(initialPrompt, sourceFrame, targetFrame) {
  console.log("startAutoConversation called with:", { initialPrompt, sourceFrame, targetFrame });
  
  if (!initialPrompt || !sourceFrame || !targetFrame) {
    console.error("Missing required parameters for auto conversation");
    alert("Error: Missing parameters. Need initialPrompt, sourceFrame, and targetFrame.");
    return "Error: Missing parameters";
  }
  
  if (sourceFrame === targetFrame) {
    console.error("Source and target frames cannot be the same");
    alert("Error: Source and target frames cannot be the same.");
    return "Error: Source and target frames cannot be the same";
  }
  
  // Send the message via IPC
  if (window.electron?.ipcRenderer) {
    try {
      console.log(`Sending message from ${sourceFrame} to ${targetFrame}:`, initialPrompt);
      
      window.electron.ipcRenderer.send('frame-message', {
        target: targetFrame,
        sender: sourceFrame,
        message: initialPrompt
      });
      
      alert(`Message sent from ${sourceFrame} to ${targetFrame}: ${initialPrompt}`);
      return "Message sent successfully";
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Error sending message: ${error.message}`);
      return `Error: ${error.message}`;
    }
  } else {
    console.error("Electron IPC not available");
    alert("Error: Electron IPC not available");
    return "Error: Electron IPC not available";
  }
}

// Define the stopAutoConversation function
function stopAutoConversation() {
  console.log("stopAutoConversation called");
  alert("Auto conversation stopped");
  return "Auto conversation stopped";
}

// Expose the functions to the window object
window.startAutoConversation = startAutoConversation;
window.stopAutoConversation = stopAutoConversation;

// Log success
console.log("Minimal auto-conversation script loaded successfully");
console.log("window.startAutoConversation =", window.startAutoConversation);
console.log("window.stopAutoConversation =", window.stopAutoConversation);

// Show an alert to confirm the script is loaded
alert("Minimal auto-conversation script loaded successfully. You can now use the Start Auto-Conversation button.");
