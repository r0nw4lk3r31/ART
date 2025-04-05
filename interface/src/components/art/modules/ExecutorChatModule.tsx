import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { MessageSquare, Send, Check, X } from 'lucide-react';
import BaseModule from './BaseModule';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  }
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

interface FrameMessage {
  sender: string;
  message: string;
  instructions?: string;
  target?: string;
}

// Define a type for errors
interface ErrorWithMessage {
  message: string;
}

interface ExecutorChatModuleProps {
  frameId: string;
  isTargeted: boolean;
  selectedApi: string;
  nanoGptModel?: string;
}

interface ApiStatus {
  name: string;
  isValid: boolean;
  key: string;
}

const SERVER_URL = 'http://localhost:3000';

// Use optional methods to match the ModuleFrame and ArtDashboard components
const ExecutorChatModule = forwardRef<{ processCommand?: (command: string) => void }, ExecutorChatModuleProps>(
  ({ frameId, isTargeted, selectedApi: initialSelectedApi, nanoGptModel = 'chatgpt-4o-latest' }, ref) => {
    const [moduleSelectedApi, setModuleSelectedApi] = useState<string>(initialSelectedApi);
    const [apiStatus, setApiStatus] = useState<ApiStatus[]>([]);
    const [codeStream, setCodeStream] = useState<{path: string, content: string, timestamp: number}[]>([]);
    const [messages, setMessages] = useState<Message[]>([
      { id: '1', content: 'Executor Chat ready. Enter a prompt to build in ART/sandbox/! Type "stop" to halt error loops.', sender: 'system', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const { toast } = useToast();
    const [errorCount, setErrorCount] = useState(0);
    const [fixHistory, setFixHistory] = useState<string[]>([]); // Track past fixes
    const MAX_ERRORS = 5;

    // Check API keys on component mount
    useEffect(() => {
      checkApiKeys();
      
      // Listen for messages from other frames
      window.electron?.ipcRenderer?.on(`frame-${frameId}`, async (event: unknown, msg: FrameMessage) => {
        const newMessage: Message = { 
          id: Date.now().toString(), 
          content: `Received from ${msg.sender}: ${msg.message}`, 
          sender: 'system', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, newMessage]);
        
        if (frameId === 'frame3' && msg.instructions) {
          try {
            const instructions = JSON.parse(msg.instructions);
            for (const instruction of instructions) {
              await executeInstruction(instruction);
            }
          } catch (error) {
            console.error('Error parsing instructions:', error);
          }
        }
      });

      return () => {
        window.electron?.ipcRenderer?.removeAllListeners(`frame-${frameId}`);
      };
    }, [frameId]);

    const checkApiKeys = async () => {
      const status: ApiStatus[] = [];
      
      // Check Grok API key
      const grokKey = import.meta.env.VITE_XAI_API_KEY;
      const grokKey2 = import.meta.env.VITE_GROK_KEY_2;
      
      if (grokKey) {
        try {
          const response = await fetch('https://api.x.ai/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${grokKey}`,
              'Content-Type': 'application/json',
            },
          });
          status.push({ 
            name: 'Grok', 
            isValid: response.ok, 
            key: grokKey 
          });
        } catch (error) {
          status.push({ name: 'Grok', isValid: false, key: grokKey });
        }
      } else {
        status.push({ name: 'Grok', isValid: false, key: '' });
      }
      
      // Check Grok API key 2 if available
      if (grokKey2) {
        try {
          const response = await fetch('https://api.x.ai/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${grokKey2}`,
              'Content-Type': 'application/json',
            },
          });
          status.push({ 
            name: 'Grok (Key 2)', 
            isValid: response.ok, 
            key: grokKey2 
          });
        } catch (error) {
          status.push({ name: 'Grok (Key 2)', isValid: false, key: grokKey2 });
        }
      }
      
      // Check NanoGPT API key
      const nanoGptKey = import.meta.env.VITE_NANOGPT_API_KEY;
      if (nanoGptKey) {
        try {
          const response = await fetch('https://nano-gpt.com/api/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${nanoGptKey}`,
              'Content-Type': 'application/json',
            },
          });
          status.push({ 
            name: 'NanoGPT', 
            isValid: response.ok, 
            key: nanoGptKey 
          });
        } catch (error) {
          status.push({ name: 'NanoGPT', isValid: false, key: nanoGptKey });
        }
      } else {
        status.push({ name: 'NanoGPT', isValid: false, key: '' });
      }
      
      setApiStatus(status);
    };

    const sendToFrame = (targetFrameId: string, message: string, instructions?: string) => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('frame-message', {
          target: targetFrameId,
          sender: frameId,
          message,
          instructions
        });
      }
    };

    // Define a type for the instruction object
    interface Instruction {
      action: string;
      path?: string;
      content?: string;
      message?: string;
      originalPrompt?: string;
      [key: string]: unknown;
    }

    const executeInstruction = async (instruction: Instruction) => {
      // Add to code stream for live display
      if (instruction.action === 'create_file' && instruction.path && instruction.content) {
        setCodeStream(prev => [...prev, { 
          path: instruction.path as string, 
          content: '', 
          timestamp: Date.now() 
        }]);
        
        // Simulate typing effect
        const lines = (instruction.content as string).split('\n');
        for (let i = 0; i < lines.length; i++) {
          await new Promise(r => setTimeout(r, 50)); // Simulate typing
          setCodeStream(prev => prev.map(item => 
            item.path === instruction.path ? { ...item, content: item.content + lines[i] + '\n' } : item
          ));
        }
      }
      const action = instruction.action;
      try {
        if (action === 'create_file') {
          const { path, content } = instruction;
          if (!path) throw new Error('Path is required');
          const response = await fetch(`${SERVER_URL}/sandbox/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          toast({ title: 'File Created', description: `Created ${path}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Created ${path}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (action === 'read_file') {
          const { path } = instruction;
          if (!path) throw new Error('Path is required');
          const response = await fetch(`${SERVER_URL}/sandbox/read?path=${encodeURIComponent(path)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          toast({ title: 'File Read', description: `Content of ${path}: ${result.content}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Read ${path}: ${result.content}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (action === 'list_files') {
          const response = await fetch(`${SERVER_URL}/sandbox/list`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          interface FileEntry {
            path: string;
          }
          const fileList = result.files.map((f: FileEntry) => f.path).join(', ') || 'none';
          toast({ title: 'Sandbox Scan', description: `Files: ${fileList}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Sandbox files: ${fileList}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (action === 'test_module') {
          const { path } = instruction;
          if (!path) throw new Error('Path is required');
          const response = await fetch(`${SERVER_URL}/sandbox/read?path=${encodeURIComponent(path)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          toast({ title: 'Test Passed', description: `Tested ${path}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Tested ${path}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (action === 'delete_file') {
          const { path } = instruction;
          if (!path) throw new Error('Path is required');
          const response = await fetch(`${SERVER_URL}/sandbox/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          toast({ title: 'File Deleted', description: `Deleted ${path}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Deleted ${path}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
        } else if (action === 'test_script') {
          const { path } = instruction;
          if (!path) throw new Error('Path is required');
          const response = await fetch(`${SERVER_URL}/sandbox/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: path })
          });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Script execution failed');
          }
          toast({ title: 'Script Tested', description: `Output: ${result.output}` });
          const newMessage: Message = { 
            id: Date.now().toString(), 
            content: instruction.message || `Tested ${path}: ${result.output}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, newMessage]);
          setErrorCount(0);
          setFixHistory([]); // Clear on success
        } else {
          throw new Error(`Unknown action: ${action}`);
        }
        setFixHistory(prev => [...prev, JSON.stringify(instruction)]); // Log successful fix
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({ title: 'Error', description: errorMessage });
        const errorMsg: Message = { 
          id: Date.now().toString(), 
          content: `Error: ${errorMessage}`, 
          sender: 'system', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMsg]);
        if (action === 'test_script' && errorCount < MAX_ERRORS && instruction.originalPrompt && !input.toLowerCase().includes('stop')) {
          setErrorCount(prev => prev + 1);
          await handlePromptWithError(instruction.originalPrompt, errorMessage);
        } else if (errorCount >= MAX_ERRORS) {
          const maxRetriesMsg: Message = { 
            id: Date.now().toString(), 
            content: `Max retries (${MAX_ERRORS}) reached. Stopping.`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, maxRetriesMsg]);
          setErrorCount(0);
          setFixHistory([]);
        }
      }
    };

    const handlePromptWithError = async (originalPrompt: string, error: string) => {
      try {
        const listResponse = await fetch(`${SERVER_URL}/sandbox/list`);
        const sandboxState = await listResponse.json();
        const sandboxFiles = sandboxState.files || [];

        const apiUrl = 'https://api.x.ai/v1/chat/completions';
        const apiKey = import.meta.env.VITE_XAI_API_KEY;
        const model = 'grok-2-latest';

        const systemContent = 'You are an AI that generates code for ART\'s ExecutorChatModule. Given the current sandbox state, user prompt, error, and past attempted fixes, return a JSON array of instructions using actions: `create_file`, `read_file`, `list_files`, `test_module`, `delete_file`, `test_script`. Each instruction must have an `action` and relevant fields (`path`, `content`, etc.). Build files in `ART/sandbox/`. For "list sandbox", return [{"action":"list_files","message":"Listing sandbox files"}] only. If an error is provided, analyze it and propose a new fix, avoiding repetition of past fixes listed. Include a `test_script` action to verify. Return only executable JSON.';
        
        const userContent = `Current sandbox: ${JSON.stringify(sandboxFiles)}\nPrompt: ${originalPrompt}\nError: ${error}\nPast fixes tried: ${JSON.stringify(fixHistory)}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: systemContent
              },
              {
                role: 'user',
                content: userContent
              }
            ],
            stream: false,
            temperature: 0
          })
        });

        const data = await response.json();
        const instructions = JSON.parse(data.choices[0].message.content);
        
        for (const instruction of instructions) {
          instruction.originalPrompt = originalPrompt;
          console.log('Executing:', instruction);
          await executeInstruction(instruction);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorMsg: Message = { 
          id: Date.now().toString(), 
          content: `Error in fix attempt: ${errorMessage}`, 
          sender: 'system', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    };

    const handlePrompt = async () => {
      if (!input.trim()) return;
      const userMessage: Message = { 
        id: Date.now().toString(), 
        content: input, 
        sender: 'user', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, userMessage]);
      console.log('Prompt:', input, 'API:', moduleSelectedApi);
      setInput('');

      if (input.toLowerCase().includes('stop')) {
        setErrorCount(0);
        setFixHistory([]);
        const stoppedMsg: Message = { 
          id: Date.now().toString(), 
          content: 'Stopped error loop.', 
          sender: 'system', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, stoppedMsg]);
        return;
      }
      
      try {
        const listResponse = await fetch(`${SERVER_URL}/sandbox/list`);
        console.log('Fetch response:', listResponse);
        const sandboxState = await listResponse.json();
        console.log('Sandbox state:', sandboxState);
        const sandboxFiles = sandboxState.files || [];

        let apiUrl, apiKey, model;
        const effectiveApi = moduleSelectedApi ? moduleSelectedApi.toLowerCase() : 'grok';
        console.log('Effective API:', effectiveApi);
        
        // Find the valid API key from our status list
        const apiStatusItem = apiStatus.find(status => 
          status.name.toLowerCase().includes(effectiveApi.toLowerCase()) && status.isValid
        );
        
        if (effectiveApi === 'grok') {
          apiUrl = 'https://api.x.ai/v1/chat/completions';
          apiKey = apiStatusItem?.key || import.meta.env.VITE_XAI_API_KEY;
          model = 'grok-2-latest';
        } else if (effectiveApi === 'nanogpt') {
          apiUrl = 'https://nano-gpt.com/api/v1/chat/completions';
          apiKey = apiStatusItem?.key || import.meta.env.VITE_NANOGPT_API_KEY;
          model = nanoGptModel;
        } else {
          throw new Error('Offline mode not supported for executor commands');
        }

        const systemContent = 'You are an AI that generates code for ART\'s ExecutorChatModule. Given the current sandbox state and user prompt, return a JSON array of instructions using actions: `create_file`, `read_file`, `list_files`, `test_module`, `delete_file`, `test_script`. Each instruction must have an `action` and relevant fields (`path`, `content`, etc.). Build files in `ART/sandbox/`. For "list sandbox", return [{"action":"list_files","message":"Listing sandbox files"}] only. After creating a script, include a `test_script` action to run it. Return only executable JSON.';
        
        const userContent = `Current sandbox: ${JSON.stringify(sandboxFiles)}\nPrompt: ${input}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: systemContent
              },
              {
                role: 'user',
                content: userContent
              }
            ],
            stream: false,
            temperature: 0
          })
        });

        console.log('xAI response status:', response.status);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        console.log('xAI data:', data);
        const instructions = JSON.parse(data.choices[0].message.content);
        console.log('Instructions:', instructions);

        for (const instruction of instructions) {
          instruction.originalPrompt = input;
          console.log('Executing:', instruction);
          await executeInstruction(instruction);
        }

        const updatedListResponse = await fetch(`${SERVER_URL}/sandbox/list`);
        const updatedSandboxState = await updatedListResponse.json();
        console.log('Updated Sandbox state:', updatedSandboxState);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({ title: 'Error', description: errorMessage });
        const apiErrorMsg: Message = { 
          id: Date.now().toString(), 
          content: `Error: ${errorMessage}`, 
          sender: 'system', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, apiErrorMsg]);
      }
    };

    useImperativeHandle(ref, () => ({
      processCommand: (command: string) => {
        const sanitized = command.trim().replace(/[\n\r\t]+$/, '');
        try {
          const instruction = JSON.parse(sanitized);
          executeInstruction(instruction);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          toast({ title: 'Error', description: 'Invalid JSON: ' + errorMessage });
          const jsonErrorMsg: Message = { 
            id: Date.now().toString(), 
            content: `Error: Invalid JSON - ${errorMessage}`, 
            sender: 'system', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, jsonErrorMsg]);
        }
      }
    }));

    return (
      <BaseModule frameId={frameId} isTargeted={isTargeted} title="Executor Chat" icon={<MessageSquare className="h-4 w-4" />}>
        <div className="flex flex-col h-full">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Select value={moduleSelectedApi} onValueChange={setModuleSelectedApi}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Select API" />
                </SelectTrigger>
                <SelectContent>
                  {apiStatus.map((api) => (
                    <SelectItem key={api.name} value={api.name}>
                      <div className="flex items-center">
                        <span>{api.name}</span>
                        <span className={`ml-2 h-2 w-2 rounded-full ${api.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex space-x-1">
                {apiStatus.map((api) => (
                  <TooltipProvider key={api.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full ${api.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="ml-1 text-xs">{api.name.split(' ')[0]}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{api.name}: {api.isValid ? 'Valid' : 'Invalid'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => checkApiKeys()}
              className="h-8 text-xs"
            >
              Refresh Keys
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            
            {/* Live code stream display */}
            {codeStream.length > 0 && (
              <div className="border border-border rounded-md p-2 bg-black/10 mt-4">
                <div className="text-xs font-semibold mb-2">Building files:</div>
                {codeStream.map((file, index) => (
                  <div key={index} className="mb-2">
                    <div className="text-xs font-mono text-blue-500">{file.path}</div>
                    <pre className="text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {file.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-muted">
            <form onSubmit={(e) => { e.preventDefault(); handlePrompt(); }} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a prompt (e.g., 'build TodoModule')"
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </BaseModule>
    );
  }
);

ExecutorChatModule.displayName = 'ExecutorChatModule';
export default ExecutorChatModule;
