import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { MessageSquare, Send, ArrowRight } from 'lucide-react';
import BaseModule from './BaseModule';
import { CodeSnippet } from '@/types/artTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  onNewCodeSnippet?: (snippet: CodeSnippet) => void;
}

// Define electron interface for TypeScript
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
        send: (channel: string, data: unknown) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
    // Add LLM collaboration functions
    startAutoConversation?: (initialPrompt: string, sourceFrame: string, targetFrame: string) => string;
    stopAutoConversation?: () => string;
    sendMessage?: (sourceFrame: string, targetFrame: string, message: string) => void;
    setupAutoResponder?: (frameId: string, apiName: string) => void;
    // Configuration object
    config?: {
      autoConversationEnabled: boolean;
      maxExchanges: number;
      exchangeDelay: number;
      currentExchanges: number;
      conversationHistory: Array<{
        timestamp: string;
        sourceFrame: string;
        targetFrame: string;
        message: string;
      }>;
      frameRoles: Record<string, string>;
    };
  }
}

// Use optional methods to match the ModuleFrame and ArtDashboard components
const ChatModule = forwardRef<{ processCommand?: (command: string) => void; addMessage?: (msg: string) => void }, ChatModuleProps>(({
  frameId,
  isTargeted,
  selectedApi,
  nanoGptModel = 'chatgpt-4o-latest',
  onNewCodeSnippet,
}, ref) => {
  const [input, setInput] = useState('');
  const [targetFrame, setTargetFrame] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am ART, your personal assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  
  interface FrameMessage {
    sender: string;
    message: string;
    instructions?: string;
    target?: string;
  }

  // Listen for messages from other frames
  useEffect(() => {
    window.electron?.ipcRenderer?.on(`frame-${frameId}`, async (event: unknown, ...args: unknown[]) => {
      console.log(`Received message in ${frameId} with args:`, args);
      
      // Extract the message object from args (it might be in an array)
      let msgObj: Record<string, unknown> | null = null;
      
      try {
        // First, try to get the message from the first argument
        if (Array.isArray(args) && args.length > 0) {
          const firstArg = args[0];
          if (firstArg && typeof firstArg === 'object') {
            msgObj = firstArg as Record<string, unknown>;
          }
        } else if (args && typeof args === 'object' && !Array.isArray(args)) {
          // If args is already an object (but not an array), use it directly
          msgObj = args as Record<string, unknown>;
        }
        
        // If we still don't have a message object, try to get it from the event
        if (!msgObj && event && typeof event === 'object') {
          // Some IPC implementations might put the data in the event object
          msgObj = event as Record<string, unknown>;
        }
        
        // Last resort: check if the event itself is the message
        if (!msgObj && args.length === 0 && event && typeof event === 'object') {
          const eventObj = event as Record<string, unknown>;
          if (eventObj.sender || eventObj.message) {
            msgObj = eventObj;
          }
        }
        
        // Validate the message structure
        if (!msgObj) {
          // Create a fallback message object for debugging
          console.warn(`Could not extract message object in ${frameId}, creating fallback:`, { args, event });
          msgObj = {
            sender: 'unknown',
            message: `Message received but could not be parsed. Check console for details.`,
            _debug: { args, event }
          };
        }
      } catch (error) {
        console.error(`Error processing message in ${frameId}:`, error);
        return;
      }
      
      console.log(`Processed message object in ${frameId}:`, msgObj);
      
      // Extract sender and message with fallbacks
      const sender = (msgObj.sender as string) || 'unknown';
      const message = (msgObj.message as string) || 'No message content';
      
      const newMessage: Message = {
        id: Date.now().toString(),
        content: `Received from ${sender}: ${message}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Auto-respond to messages from other frames
      if (message && isTargeted && selectedApi) {
        // Check if auto-conversation is enabled
        const autoConversationEnabled = window.config?.autoConversationEnabled;
        
        if (autoConversationEnabled) {
          console.log(`Auto-responding in ${frameId} to message from ${sender}`);
          const response = await processCommand(`You are in ${frameId}. Respond to this message from ${sender}: ${message}`);
          
          // If we got a response and auto-conversation is still enabled, send it back
          if (response && window.config?.autoConversationEnabled) {
            setTimeout(() => {
              if (window.electron?.ipcRenderer) {
                console.log(`Sending auto-response from ${frameId} to ${sender}`);
                window.electron.ipcRenderer.send('frame-message', {
                  target: sender,
                  sender: frameId,
                  message: response
                });
                
                // Add to our own messages
                const sentMessage: Message = {
                  id: Date.now().toString(),
                  content: `Auto-sent to ${sender}: ${response}`,
                  sender: 'user',
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, sentMessage]);
              }
            }, 1000); // Small delay to make the conversation feel more natural
          }
        } else {
          // Regular response without auto-reply
          await processCommand(`Respond to this message from ${sender}: ${message}`);
        }
      }
    });

    return () => {
      window.electron?.ipcRenderer?.removeAllListeners(`frame-${frameId}`);
    };
  }, [frameId, isTargeted, selectedApi]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: command,
      sender: 'user',
      timestamp: new Date(),
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
            stream: false,
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
      } else { // Offline mode
        reply = `Offline mode: Echoing "${command}" since I'm not connected.`;
      }

      // Detect code blocks in the reply
      const codeRegex = /```([a-z]*)\n([\s\S]*?)```/g;
      let cleanedReply = reply;
      const codeSnippets: CodeSnippet[] = [];
      let match;
      while ((match = codeRegex.exec(reply)) !== null) {
        const language = match[1] || 'text';
        const code = match[2].trim();
        const snippet: CodeSnippet = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          content: code,
          language,
          title: `From Chat (${language})`,
          timestamp: new Date(),
        };
        codeSnippets.push(snippet);
        cleanedReply = cleanedReply.replace(match[0], `[Code snippet saved to CodingModule]`);
      }

      if (codeSnippets.length > 0 && onNewCodeSnippet) {
        codeSnippets.forEach(snippet => onNewCodeSnippet(snippet));
      }

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: cleanedReply,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, responseMessage]);
      
      // Return the reply for use in auto-conversation
      return cleanedReply;
    } catch (error: unknown) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Oops, something's off: ${errorMsg}. Check keys or try later!`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (msg: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: msg,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  useImperativeHandle(ref, () => ({
    processCommand,
    addMessage,
  }));

  // Send message to another frame
  const sendToFrame = (targetFrameId: string, message: string) => {
    if (window.electron?.ipcRenderer) {
      // Make sure we're not sending to our own frame
      if (targetFrameId === frameId) {
        console.error(`Cannot send message to own frame (${frameId})`);
        
        // Add error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `Error: Cannot send message to your own frame. Please select a different target frame.`,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      console.log(`Sending message from ${frameId} to ${targetFrameId}:`, message);
      
      // Send the message via IPC
      window.electron.ipcRenderer.send('frame-message', {
        target: targetFrameId,
        sender: frameId,
        message
      });
      
      // Add to our own messages
      const sentMessage: Message = {
        id: Date.now().toString(),
        content: `Sent to ${targetFrameId}: ${message}`,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sentMessage]);
      setInput('');
    } else {
      console.error("Electron IPC not available for sending messages");
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Error: Communication system not available. Please check the console for errors.`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendToFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && targetFrame) {
      sendToFrame(targetFrame, input);
    }
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
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'}`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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
        
        {isTargeted && (
          <div className="p-2 border-t border-muted">
            <form onSubmit={handleSendToFrame} className="flex space-x-2">
              <Select value={targetFrame} onValueChange={setTargetFrame}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frame1">Frame 1</SelectItem>
                  <SelectItem value="frame2">Frame 2</SelectItem>
                  <SelectItem value="frame3">Frame 3</SelectItem>
                  <SelectItem value="frame4">Frame 4</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send message to another frame..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!targetFrame || !input.trim()}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            
            {/* Auto-conversation controls */}
            <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
              <button 
                onClick={() => {
                  if (window.startAutoConversation && targetFrame && input.trim()) {
                    window.startAutoConversation(input, frameId, targetFrame);
                    setInput('');
                  } else {
                    console.error("Auto conversation not available or missing parameters");
                  }
                }}
                className="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs"
                disabled={!targetFrame || !input.trim()}
              >
                Start Auto-Conversation
              </button>
              
              <button 
                onClick={() => {
                  if (window.stopAutoConversation) {
                    window.stopAutoConversation();
                  } else {
                    console.error("Stop function not available");
                  }
                }}
                className="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs"
              >
                Stop
              </button>
            </div>
          </div>
        )}
        
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
