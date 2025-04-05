# ART Multi-API Chat & Live Coding

This document explains how to use the new multi-API chat frames and LLMs talking & live coding features in the ART interface.

## Multi-API Chat Frames

Each ExecutorChatModule and ChatModule can now select which API to use:

1. **API Selection**:
   - Each module has a dropdown to select between Grok and NanoGPT APIs
   - The selected API is used for all requests from that module

2. **API Status Lights**:
   - Green: API key is valid and working
   - Red: API key is invalid or not configured
   - Hover over the status light to see more details

3. **Multiple API Keys**:
   - Support for multiple API keys (e.g., VITE_GROK_KEY_2)
   - Keys are checked on module load and can be refreshed with the "Refresh Keys" button

## LLMs Talking & Live Coding

The frames can now communicate with each other, enabling LLMs to collaborate on projects:

1. **Frame-to-Frame Communication**:
   - Each ChatModule has a dropdown to select a target frame
   - Type a message and click the arrow button to send it to the target frame
   - The receiving frame will display the message and can auto-respond

2. **Live Code Display**:
   - The ExecutorChatModule now shows a live display of files being built
   - Files are displayed with syntax highlighting
   - The content is animated to simulate typing for a better visual experience

3. **Example Workflow**:
   - Frame 1 (Grok): Propose a project and send to Frame 2
   - Frame 2 (ChatGPT): Design the implementation and send to Frame 3
   - Frame 3 (Executor): Build the project based on the instructions

## JSON Instruction Format

The ExecutorChatModule accepts JSON instructions with the following format:

```json
[
  {
    "action": "create_file",
    "path": "ART/sandbox/project/file.js",
    "content": "// File content here",
    "message": "Created file.js"
  },
  {
    "action": "test_script",
    "path": "ART/sandbox/project/file.js",
    "message": "Testing file.js"
  }
]
```

Available actions:
- `create_file`: Create a new file
- `read_file`: Read an existing file
- `list_files`: List files in the sandbox
- `test_module`: Test a module
- `delete_file`: Delete a file
- `test_script`: Run a script

See `example-instructions.json` for a complete example.
