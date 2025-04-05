# ART Sandbox

This directory is used by the ExecutorChatModule to build and test code.

## Features

- Multi-API Chat Frames
  - Each ExecutorChatModule can select its API (Grok, ChatGPT)
  - API status lights show if keys are valid
  - Support for multiple API keys

- LLMs Talking & Live Coding
  - Frame 1 (Grok) and Frame 2 (ChatGPT) can communicate
  - Frame 3 (Executor) can build code based on their conversation
  - Live code display shows files being built in real-time

## Usage

1. Set up the ART interface with 3 frames:
   - Frame 1: ChatModule with Grok API
   - Frame 2: ChatModule with NanoGPT API
   - Frame 3: ExecutorChatModule

2. Start a conversation in Frame 1 and send messages to Frame 2
3. Frame 2 can respond and send instructions to Frame 3
4. Frame 3 will build the code based on the instructions

## Example Conversation

Frame 1 (Grok): "Let's build a simple React counter component"
Frame 2 (ChatGPT): "Great idea! I'll design the UI with Tailwind CSS"
Frame 3 (Executor): *builds the component based on their conversation*
