# Debugging Frame-to-Frame Communication in ART Interface

This guide provides step-by-step instructions for testing and debugging the frame-to-frame communication functionality in the ART interface.

## Quick Test Instructions

1. Open the ART interface with multiple frames visible
2. In each frame's browser console (F12 or Ctrl+Shift+I), run:
   ```javascript
   const script = document.createElement('script');
   script.src = '/sandbox/test-frame-communication.js';
   document.head.appendChild(script);
   ```
3. After running the script in both frames, you'll see test instructions in the console
4. In one frame, run `test.sendTestMessage()` to send a test message to the other frame
5. You should see a green notification appear in the target frame

## Detailed Debugging Steps

### 1. Verify Electron IPC is Available

In each frame's console, check if the Electron IPC is properly exposed:

```javascript
console.log(window.electron?.ipcRenderer);
```

This should show the IPC renderer object with `send`, `on`, and `removeAllListeners` methods.

### 2. Check Frame IDs

Verify that each frame has the correct frame ID:

```javascript
document.querySelector('[data-frame-id]')?.dataset.frameId;
```

This should return `frame1`, `frame2`, etc., depending on which frame you're in.

### 3. Monitor IPC Messages

To see all IPC messages being sent and received, run this in each frame:

```javascript
// Monitor sent messages
const originalSend = window.electron.ipcRenderer.send;
window.electron.ipcRenderer.send = function(channel, data) {
  console.log(`%c[SEND] ${channel}:`, 'color: blue; font-weight: bold', data);
  return originalSend.apply(this, arguments);
};

// Set up listeners for all frames
['frame1', 'frame2', 'frame3', 'frame4'].forEach(frameId => {
  window.electron.ipcRenderer.on(`frame-${frameId}`, (msg) => {
    console.log(`%c[RECEIVE] frame-${frameId}:`, 'color: green; font-weight: bold', msg);
  });
});
```

### 4. Test Manual Message Sending

Try sending a message manually:

```javascript
window.electron.ipcRenderer.send('frame-message', {
  target: 'frame2', // Change to the target frame
  sender: 'frame1', // Change to your current frame
  message: 'Test message at ' + new Date().toISOString()
});
```

### 5. Check for Errors in Main Process

If messages aren't being received, check the Electron main process logs for errors. These will appear in the terminal where you started the ART interface.

### 6. Test the Enhanced Communication System

To test the enhanced LLM collaboration system:

```javascript
// Load the collaboration scripts
const script1 = document.createElement('script');
script1.src = '/sandbox/llm-collaboration.js';
document.head.appendChild(script1);

// After it loads, start an auto-conversation
setTimeout(() => {
  if (window.startAutoConversation) {
    window.startAutoConversation(
      'Let\'s discuss a marketing strategy for nano tech',
      'frame1', // Source frame
      'frame2'  // Target frame
    );
  } else {
    console.error('Auto-conversation functionality not available');
  }
}, 1000);
```

### 7. Debug Common Issues

If messages aren't being received, check for these common issues:

- **Same Frame Issue**: Make sure you're not trying to send a message to the same frame
- **Missing Properties**: Ensure messages have `target`, `sender`, and `message` properties
- **IPC Channel Names**: Verify the channel names match exactly (`frame-frame1`, `frame-frame2`, etc.)
- **Listener Setup**: Confirm listeners are set up before messages are sent
- **Console Errors**: Look for any errors in the browser console or main process logs

## Using the Test Script

The `test-frame-communication.js` script provides several useful functions:

- `testFrameCommunication(sourceFrame, targetFrame, message)`: Sends a test message
- `setupFrameListener(frameId)`: Sets up a listener for a specific frame
- `detectCurrentFrame()`: Tries to detect which frame the script is running in
- `runCommunicationTest()`: Runs a complete test with instructions

After loading the script, you can use these functions to test different aspects of the communication system.

## Troubleshooting

If you encounter issues:

1. **Restart the Application**: Sometimes a clean restart resolves communication issues
2. **Check Console for Errors**: Look for error messages in the browser console
3. **Verify Frame IDs**: Make sure you're using the correct frame IDs
4. **Test with Simple Messages**: Start with simple text messages before trying complex data
5. **Check Main Process**: Verify the main process is correctly forwarding messages

By following these steps, you should be able to identify and fix any issues with the frame-to-frame communication system.
