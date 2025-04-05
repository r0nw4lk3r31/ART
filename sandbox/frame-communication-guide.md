# Frame-to-Frame Communication Guide

This guide explains how to use the frame-to-frame communication feature in the ART interface.

## How It Works

1. Each frame has a unique ID: `frame1`, `frame2`, `frame3`, or `frame4`.
2. Messages are sent from one frame to another using the IPC (Inter-Process Communication) system.
3. The sender specifies the target frame ID, and the message is delivered to that frame.

## Sending Messages Between Frames

### Using the Chat Module UI

1. Click on a Chat Module to target it.
2. Use the dropdown to select the target frame (e.g., "Frame 2").
3. Type your message in the input field.
4. Click the arrow button to send the message.

The message will appear in both frames:
- In the sender frame: "Sent to frame2: Your message"
- In the receiver frame: "Received from frame1: Your message"

### Sending Instructions to the Executor Chat Module

When sending messages to the Executor Chat Module (typically in frame3), you can include JSON instructions:

1. In a Chat Module (frame1 or frame2), send a message to frame3 with JSON instructions.
2. The Executor Chat Module will parse the instructions and execute them.

Example message with instructions:
```
I've designed a React counter component. Here's the code:

```json
[
  {
    "action": "create_file",
    "path": "ART/sandbox/counter/index.html",
    "content": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Counter</title>\n</head>\n<body>\n  <div id=\"app\"></div>\n  <script>\n    // Counter code here\n  </script>\n</body>\n</html>",
    "message": "Created counter HTML file"
  }
]
```
```

## Troubleshooting

If messages are not being received:

1. **Check Frame IDs**: Make sure you're using the correct frame IDs (`frame1`, `frame2`, etc.).
2. **Check Console**: Open the developer console (Ctrl+Shift+I) to see if there are any errors.
3. **Restart the Application**: Sometimes restarting the application can resolve communication issues.

## Example Code

Here's how the frame-to-frame messaging is implemented:

```javascript
// Sending a message
window.electron.ipcRenderer.send('frame-message', {
  target: 'frame2',  // Target frame ID
  sender: 'frame1',  // Sender frame ID
  message: 'Hello from Frame 1!'  // Message content
});

// Receiving a message
window.electron.ipcRenderer.on('frame-frame1', (msg) => {
  console.log(`Received message: ${msg.message}`);
});
```

## Tips for Effective Communication

1. **Be Clear and Concise**: Keep messages clear and to the point.
2. **Use JSON for Instructions**: When sending instructions to the Executor Chat Module, use well-formatted JSON.
3. **Include Context**: When sending messages between LLMs, include context about what you're working on.
4. **Coordinate Roles**: Assign clear roles to each frame (e.g., Frame 1 for planning, Frame 2 for implementation).

## Advanced: Sending Instructions from Code

You can also send instructions programmatically using the test-communication.js script:

```javascript
// Example from test-communication.js
function sendFromFrame1ToFrame2() {
  window.electron.ipcRenderer.send('frame-message', {
    target: 'frame2',
    sender: 'frame1',
    message: 'Hello from Frame 1! Let\'s build a React counter component.'
  });
}

function sendFromFrame2ToFrame3() {
  const instructions = [
    {
      "action": "create_file",
      "path": "ART/sandbox/counter/index.html",
      "content": "<!DOCTYPE html>...",
      "message": "Created React Counter component"
    }
  ];

  window.electron.ipcRenderer.send('frame-message', {
    target: 'frame3',
    sender: 'frame2',
    message: 'I\'ve designed a React counter component. Building it now in Frame 3.',
    instructions: JSON.stringify(instructions)
  });
}
