import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MessageSquare } from 'lucide-react';
import BaseModule from './BaseModule';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatModuleProps {
  frameId: string;
  isTargeted: boolean;
  selectedApi: string;
  nanoGptModel?: string;
}

const ChatModule = forwardRef<{ processCommand: (command: string) => void }, ChatModuleProps>(({
  frameId, 
  isTargeted,
  selectedApi,
  nanoGptModel = 'chatgpt-4o-latest'
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am ART, your personal assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: command,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);

    try {
      let reply = '';
      if (selectedApi === 'NanoGPT') {
        const apiKey = import.meta.env.VITE_NANOGPT_API_KEY;
        const response = await fetch('https://nano-gpt.com/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: nanoGptModel,
            messages: [
              { role: 'system', content: 'You are ART, a helpful assistant.' },
              { role: 'user', content: command }
            ],
            stream: false // Non-streaming for simplicity
          }),
        });

        if (!response.ok) throw new Error(`NanoGPT error: ${response.status}`);
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || 'No response from NanoGPT.';
      } else if (selectedApi === 'Grok') {
        const apiKey = import.meta.env.VITE_XAI_API_KEY;
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [
              { role: 'system', content: 'You are ART, a helpful assistant.' },
              { role: 'user', content: command }
            ],
          }),
        });

        if (!response.ok) throw new Error(`Grok error: ${response.status}`);
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || 'No response from Grok.';
      } else { // Offline
        reply = `Offline mode: Echoing "${command}" since I’m not connected.`;
      }

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: reply,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Oops, something’s off: ${error.message}. Check keys or try later!`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    processCommand
  }));

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Chat"
      icon={<MessageSquare className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground max-w-[80%] rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse delay-150"></div>
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        {!isTargeted && (
          <div className="py-3 text-center text-sm text-muted-foreground border border-dashed rounded-md">
            Click to target this chat frame and use the console command bar below
          </div>
        )}
      </div>
    </BaseModule>
  );
});

ChatModule.displayName = 'ChatModule';

export default ChatModule;