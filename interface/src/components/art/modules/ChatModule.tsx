
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const ChatModule = ({ frameId, isTargeted }: ChatModuleProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am ART, your personal assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // This function will be triggered by the ArtConsole when commands are submitted
  // and the frame is targeted
  const processCommand = (command: string) => {
    if (!command.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: command,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);

    // Simulate assistant response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I've processed your request: "${command}"`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
      setIsProcessing(false);
    }, 1000);
  };

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
        
        {/* The input bar at the bottom has been removed as requested */}
        {/* The console command bar will be used instead when this frame is targeted */}
        
        {!isTargeted && (
          <div className="py-3 text-center text-sm text-muted-foreground border border-dashed rounded-md">
            Click to target this chat frame and use the console command bar below
          </div>
        )}
      </div>
    </BaseModule>
  );
};

export default ChatModule;
