# LLM Collaboration System for ART Interface

This system enables automatic back-and-forth conversation between chat frames in the ART interface, allowing LLMs to collaborate on tasks and projects.

## Overview

The LLM Collaboration System consists of several components:

1. **Simple Frame Test** (`simple-frame-test.js`) - A lightweight tool for testing frame-to-frame communication
2. **Auto-Conversation Module** (`auto-conversation.js`) - Enables automatic conversations between frames
3. **Load Collaboration Scripts** (`load-collaboration-scripts.js`) - Loads all necessary scripts and initializes the system

## Installation

To use the LLM Collaboration System, run the following code in the browser console of each frame:

```javascript
const script = document.createElement('script');
script.src = '/sandbox/load-collaboration-scripts.js';
document.head.appendChild(script);
```

This will load all necessary scripts and initialize the system.

## Usage

### Basic Frame-to-Frame Communication

The system enhances the existing frame-to-frame communication in the ART interface. You can send messages between frames using the dropdown and input field in each chat frame.

### Auto-Conversation

The Auto-Conversation feature allows LLMs to automatically converse back and forth. To use this feature:

1. Enter an initial prompt in the chat input field
2. Select a target frame from the dropdown
3. Click the "Start Auto-Conversation" button
4. The LLMs will automatically converse back and forth
5. Click "Stop" to end the conversation

### Using the Simple Frame Test

The Simple Frame Test provides a visual UI for testing frame-to-frame communication. After loading the scripts, you'll see a test panel in the bottom-right corner of each frame. You can:

1. Select a target frame
2. Enter a message
3. Click "Send Message"
4. See the message appear in the target frame

## Debugging

If you encounter issues with the frame-to-frame communication, refer to the `debug-frame-communication.md` guide for detailed debugging steps.

## Components

### simple-frame-test.js

A standalone tool for testing frame-to-frame communication. It provides:

- A visual UI for sending and receiving messages
- Detailed logging of message sending and receiving
- Visual notifications for message events

### auto-conversation.js

The core module for automatic conversations between frames. It:

- Creates a UI for starting and stopping conversations
- Handles message passing between frames
- Extracts code from messages and sends to the Executor frame
- Logs conversation history

### load-collaboration-scripts.js

A loader script that:

- Loads all necessary scripts
- Initializes the system
- Provides configuration options
- Can auto-start conversations

## Configuration

You can configure the system by modifying the `config` object in `load-collaboration-scripts.js`:

```javascript
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
```

To enable auto-start, set `config.autoStart.enabled` to `true`.

## Example Use Cases

### Marketing Strategy Development

1. In Frame 1, enter "Develop a marketing strategy for nano technology"
2. Select Frame 2 as the target
3. Click "Start Auto-Conversation"
4. The LLMs will collaborate to develop a marketing strategy

### Collaborative Coding

1. In Frame 1, enter "Let's build a simple web application for tracking expenses"
2. Select Frame 2 as the target
3. Click "Start Auto-Conversation"
4. The LLMs will collaborate on designing and coding the application
5. Any code snippets will be automatically sent to Frame 3 (Executor)

### Project Planning

1. In Frame 4 (Conductor), enter "Plan a project to develop a mobile app for fitness tracking"
2. Select Frame 1 as the target
3. Click "Start Auto-Conversation"
4. The Conductor will orchestrate the conversation between frames to plan the project

## Troubleshooting

If messages aren't being received:

1. Check the browser console for errors
2. Verify that the scripts are loaded correctly
3. Make sure you're not trying to send a message to the same frame
4. Check that the frame IDs are correct
5. Try reloading the page and starting again

For more detailed troubleshooting, refer to the `debug-frame-communication.md` guide.
