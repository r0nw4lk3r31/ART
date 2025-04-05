// This is a test script to demonstrate frame-to-frame communication
// You can copy and paste these examples into the console to test the functionality

// Example 1: Send a message from Frame 1 to Frame 2
function sendFromFrame1ToFrame2() {
  // This simulates what happens when you use the UI to send a message
  window.electron.ipcRenderer.send('frame-message', {
    target: 'frame2',
    sender: 'frame1',
    message: 'Hello from Frame 1! Let\'s build a React counter component.'
  });
  console.log('Message sent from Frame 1 to Frame 2');
}

// Example 2: Send a message from Frame 2 to Frame 3 with instructions
function sendFromFrame2ToFrame3() {
  // This includes instructions for the ExecutorChatModule
  const instructions = [
    {
      "action": "create_file",
      "path": "ART/sandbox/counter/index.html",
      "content": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>React Counter</title>\n  <script src=\"https://unpkg.com/react@17/umd/react.development.js\"></script>\n  <script src=\"https://unpkg.com/react-dom@17/umd/react-dom.development.js\"></script>\n  <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>\n  <link href=\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\">\n</head>\n<body class=\"bg-gray-100 flex items-center justify-center h-screen\">\n  <div id=\"root\"></div>\n\n  <script type=\"text/babel\">\n    function Counter() {\n      const [count, setCount] = React.useState(0);\n\n      return (\n        <div className=\"bg-white p-6 rounded-lg shadow-lg text-center\">\n          <h1 className=\"text-2xl font-bold mb-4\">React Counter</h1>\n          <p className=\"text-4xl font-bold mb-6\">{count}</p>\n          <div className=\"flex space-x-4 justify-center\">\n            <button \n              className=\"bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded\"\n              onClick={() => setCount(count - 1)}\n            >\n              Decrease\n            </button>\n            <button \n              className=\"bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded\"\n              onClick={() => setCount(0)}\n            >\n              Reset\n            </button>\n            <button \n              className=\"bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded\"\n              onClick={() => setCount(count + 1)}\n            >\n              Increase\n            </button>\n          </div>\n        </div>\n      );\n    }\n\n    ReactDOM.render(<Counter />, document.getElementById('root'));\n  </script>\n</body>\n</html>",
      "message": "Created React Counter component with Tailwind CSS"
    },
    {
      "action": "test_script",
      "path": "ART/sandbox/counter/index.html",
      "message": "Testing the counter component"
    }
  ];

  window.electron.ipcRenderer.send('frame-message', {
    target: 'frame3',
    sender: 'frame2',
    message: 'I\'ve designed a React counter component. Building it now in Frame 3.',
    instructions: JSON.stringify(instructions)
  });
  console.log('Message with instructions sent from Frame 2 to Frame 3');
}

// Example 3: Listen for messages on a specific frame
function listenOnFrame(frameId) {
  window.electron.ipcRenderer.on(`frame-${frameId}`, (msg) => {
    console.log(`Received message on frame-${frameId}:`, msg);
  });
  console.log(`Listening for messages on frame-${frameId}`);
}

// Usage examples (run these in the browser console):
// 
// 1. In Frame 1:
//    listenOnFrame('frame1')
//    sendFromFrame1ToFrame2()
//
// 2. In Frame 2:
//    listenOnFrame('frame2')
//    sendFromFrame2ToFrame3()
//
// 3. In Frame 3:
//    listenOnFrame('frame3')
