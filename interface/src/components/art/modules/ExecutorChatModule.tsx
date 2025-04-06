import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Terminal, ArrowRight } from "lucide-react";
import BaseModule from "./BaseModule";
import { CodeSnippet } from "@/types/artTypes";
import { Input, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface Instruction {
  action: "create_file" | "read_file" | "list_files" | "test_module" | "update_file" | "delete_file" | "test_script";
  path?: string;
  content?: string;
  message?: string;
}

const SERVER_URL = "http://localhost:3000";

const ExecutorChatModule = forwardRef<
  { processCommand?: (command: string) => Promise<string | null>; addMessage?: (msg: string) => void },
  { frameId: string; isTargeted: boolean; selectedApi: string; nanoGptModel?: string; onNewCodeSnippet?: (snippet: CodeSnippet) => void; chatRefs?: React.MutableRefObject<Record<string, { processCommand?: (cmd: string) => Promise<string | null>; addMessage?: (msg: string) => void }>> }
>(({ frameId, isTargeted, selectedApi, nanoGptModel = "chatgpt-4o-latest", onNewCodeSnippet, chatRefs }, ref) => {
  const [input, setInput] = useState("");
  const [targetFrame, setTargetFrame] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", content: "Executor ready. Send 'build: ```lang\ncode```' or a task for ART to write to the sandbox.", sender: "assistant", timestamp: new Date() },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentFileRef = useRef<string | null>(null);

  const executeInstruction = async (instruction: Instruction): Promise<string> => {
    console.log(`[${new Date().toLocaleTimeString()}] Executing:`, instruction);
    
    // Create directory structure if needed
    const ensureDirectoryExists = async (path: string) => {
      const dirPath = path.split('/').slice(0, -1).join('/');
      if (dirPath) {
        try {
          await fetch(`${SERVER_URL}/sandbox/mkdir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: dirPath }),
          });
        } catch (error) {
          console.error("Error creating directory:", error);
          // Continue anyway, the write might still succeed
        }
      }
    };
    
    if (instruction.action === "create_file" && instruction.path && instruction.content) {
      // Ensure directory exists
      await ensureDirectoryExists(instruction.path);
      
      const response = await fetch(`${SERVER_URL}/sandbox/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: instruction.path, content: instruction.content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create file");
      
      // Store the path for future reference
      currentFileRef.current = instruction.path;
      
      const reply = instruction.message || `ART created ${instruction.path}. What's next?`;
      if (instruction.content) {
        const snippet: CodeSnippet = {
          id: Date.now().toString(),
          content: instruction.content,
          language: instruction.path.split('.').pop() || "text",
          title: `Sandbox Build by ART`,
          timestamp: new Date(),
        };
        onNewCodeSnippet?.(snippet);
      }
      return reply;
    } else if (instruction.action === "update_file" && instruction.path && instruction.content) {
      // Ensure directory exists
      await ensureDirectoryExists(instruction.path);
      
      const response = await fetch(`${SERVER_URL}/sandbox/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: instruction.path, content: instruction.content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update file");
      
      // Update the current file reference if needed
      if (!currentFileRef.current) {
        currentFileRef.current = instruction.path;
      }
      
      return instruction.message || `ART updated ${instruction.path}. Testing again.`;
    } else if (instruction.action === "read_file" && instruction.path) {
      const response = await fetch(`${SERVER_URL}/sandbox/read?path=${encodeURIComponent(instruction.path)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return instruction.message || `ART read ${instruction.path}: ${result.content}`;
    } else if (instruction.action === "list_files") {
      const response = await fetch(`${SERVER_URL}/sandbox/list`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const fileList = result.files.map((f: { path: string }) => f.path).join(", ") || "none";
      return instruction.message || `ART lists sandbox files: ${fileList}`;
    } else if (instruction.action === "test_module" && instruction.path) {
      try {
        // Simulate testing the module
        // In a real implementation, this would run the code in a sandbox environment
        // and check for errors or validate functionality
        
        // For now, we'll just read the file to verify it exists
        const response = await fetch(`${SERVER_URL}/sandbox/read?path=${encodeURIComponent(instruction.path)}`);
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || "File not found");
        
        // Check for common errors in the code
        const content = result.content;
        
        // Simulate some basic validation
        if (content.includes("weather") && !content.includes("API_KEY")) {
          throw new Error("API key missing in weather module");
        }
        
        if (content.includes("<script>") && !content.includes("</script>")) {
          throw new Error("Unclosed script tag in HTML");
        }
        
        // If we get here, the test passed
        return "Success";
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Error: ${errorMsg}`);
      }
    } else {
      throw new Error(`Unsupported action: ${instruction.action}`);
    }
  };

  const processCommand = async (command: string): Promise<string | null> => {
    if (!command.trim()) return null;
    if (command.toLowerCase() === "stop") {
      setMessages(prev => [...prev, { 
        id: `${frameId}-stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: "Operation stopped.", 
        sender: "assistant", 
        timestamp: new Date() 
      }]);
      return "Stopped";
    }
  
    const newUserMessage: Message = { 
      id: `${frameId}-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      content: command, 
      sender: "user", 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);
  
    try {
      // Handle build: commands with code blocks
      if (command.startsWith("build:")) {
        const codeMatch = command.match(/build:\s*```(\w+)?\n([\s\S]*?)```/);
        if (codeMatch) {
          const language = codeMatch[1] || "text";
          const code = codeMatch[2].trim();
          const extension = language === "javascript" ? "js" : 
                           (language === "python" ? "py" : 
                           (language === "html" ? "html" : language));
          
          // Create folder structure with timestamp for organization
          const folderName = `weather-${Date.now()}`;
          const fileName = `${folderName}/${language}.${extension}`;
          currentFileRef.current = fileName; // Track current file
          
          const reply = await executeInstruction({ action: "create_file", path: fileName, content: code });
          const responseMessage: Message = { 
            id: `${frameId}-built-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            content: reply, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, responseMessage]);
          return reply;
        } else {
          throw new Error("Invalid build format. Use 'build: ```lang\ncode```'.");
        }
      }
      
      // Handle "Test it" command
      if (command === "Test it" || command.includes("From ") && command.includes(": Test it")) {
        if (!currentFileRef.current) {
          const reply = "Error: No file to test. Please build something first.";
          const responseMessage: Message = { 
            id: `${frameId}-nofile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            content: reply, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, responseMessage]);
          return reply;
        }
        
        try {
          // Use the file path directly without ART/sandbox prefix
          const testPath = currentFileRef.current;
          console.log(`[${new Date().toLocaleTimeString()}] Testing module: ${testPath}`);
          
          const reply = await executeInstruction({ 
            action: "test_module", 
            path: testPath 
          });
          
          const responseMessage: Message = { 
            id: `${frameId}-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            content: reply, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, responseMessage]);
          return reply;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          const reply = `${errorMsg}`;
          const responseMessage: Message = { 
            id: `${frameId}-testerror-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            content: reply, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, responseMessage]);
          return reply;
        }
      }
  
      // Process "From frame" messages
      if (command.startsWith("From ") && command.includes(":")) {
        const [frameSource, actualCommand] = command.split(": ", 2);
        const messageCache = messages.map(m => m.content);
        
        // Check for exact duplicates
        if (messageCache.some(m => m === command)) {
          const reply = "Already processed this exact request.";
          const responseMessage: Message = { 
            id: `${frameId}-dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            content: reply, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, responseMessage]);
          return reply;
        }
        
        // Handle Fix: commands
        if (actualCommand.startsWith("Fix:")) {
          const codeMatch = actualCommand.match(/Fix:\s*```(\w+)?\n([\s\S]*?)```/);
          if (codeMatch && currentFileRef.current) {
            const language = codeMatch[1] || "text";
            const code = codeMatch[2].trim();
            
            // Use the file path directly without ART/sandbox prefix
            const fileName = currentFileRef.current;
            console.log(`[${new Date().toLocaleTimeString()}] Updating file: ${fileName}`);
            
            const reply = await executeInstruction({ 
              action: "update_file", 
              path: fileName, 
              content: code 
            });
            
            const responseMessage: Message = { 
              id: `${frameId}-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              content: reply, 
              sender: "assistant", 
              timestamp: new Date() 
            };
            setMessages(prev => [...prev, responseMessage]);
            return reply;
          } else {
            const reply = "Error: Invalid fix format or no file to update.";
            const responseMessage: Message = { 
              id: `${frameId}-fixerror-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              content: reply, 
              sender: "assistant", 
              timestamp: new Date() 
            };
            setMessages(prev => [...prev, responseMessage]);
            return reply;
          }
        }
        
        // Handle build requests
        if (actualCommand.toLowerCase().includes("build")) {
          // Extract core concept terms
          const keyTerms = actualCommand.toLowerCase()
            .replace(/build\s+a\s+/i, '')
            .replace(/build\s+/i, '')
            .split(' ')
            .filter(term => term.length > 3)
            .slice(0, 3);
            
          // Get ART created messages  
          const createdMessages = messages.filter(m => 
            m.content.includes("ART created") && 
            m.sender === "assistant"
          ).map(m => m.content.toLowerCase());
            
          // Check if we've created something similar
          const hasMatchingBuild = createdMessages.some(message => {
            const matchCount = keyTerms.filter(term => message.includes(term.toLowerCase())).length;
            return matchCount >= Math.min(2, keyTerms.length);
          });
            
          if (hasMatchingBuild) {
            const reply = "Already built something similar. What's next?";
            const responseMessage: Message = { 
              id: `${frameId}-similar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              content: reply, 
              sender: "assistant", 
              timestamp: new Date() 
            };
            setMessages(prev => [...prev, responseMessage]);
            return reply;
          }
          
          // Create a simple weather module as an example
          if (actualCommand.toLowerCase().includes("weather")) {
            const language = "html";
            const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Module</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .weather-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .weather-form {
      margin-bottom: 20px;
    }
    input, button {
      padding: 8px;
      margin-right: 8px;
    }
    button {
      cursor: pointer;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Weather Module</h1>
  
  <div class="weather-form">
    <input type="text" id="city" placeholder="Enter city name">
    <button onclick="getWeather()">Get Weather</button>
  </div>
  
  <div class="weather-card" id="weather-info">
    <p>Enter a city name to get the current weather.</p>
  </div>
  
  <script>
    function getWeather() {
      const city = document.getElementById('city').value;
      const weatherInfo = document.getElementById('weather-info');
      
      if (!city) {
        weatherInfo.innerHTML = '<p class="error">Please enter a city name</p>';
        return;
      }
      
      weatherInfo.innerHTML = '<p>Loading weather data...</p>';
      
      // Replace with your actual API key
      const apiKey = 'YOUR_OPENWEATHER_API_KEY';
      const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=\${apiKey}&units=metric\`;
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('City not found or API error');
          }
          return response.json();
        })
        .then(data => {
          const temp = data.main.temp;
          const description = data.weather[0].description;
          const humidity = data.main.humidity;
          const windSpeed = data.wind.speed;
          
          weatherInfo.innerHTML = \`
            <h2>Weather in \${city}</h2>
            <p>Temperature: \${temp}°C</p>
            <p>Conditions: \${description}</p>
            <p>Humidity: \${humidity}%</p>
            <p>Wind Speed: \${windSpeed} m/s</p>
          \`;
        })
        .catch(error => {
          weatherInfo.innerHTML = \`<p class="error">Error: \${error.message}</p>\`;
        });
    }
  </script>
</body>
</html>`;
            
            // Create folder structure with timestamp for organization
            const folderName = `weather-${Date.now()}`;
            const fileName = `${folderName}/html.html`;
            currentFileRef.current = fileName; // Track current file
            
            const reply = await executeInstruction({ action: "create_file", path: fileName, content: code });
            const responseMessage: Message = { 
              id: `${frameId}-weatherbuild-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              content: reply, 
              sender: "assistant", 
              timestamp: new Date() 
            };
            setMessages(prev => [...prev, responseMessage]);
            return reply;
          }
        }
        
        // If we get here, we don't know how to handle the command
        const reply = "Clarify your request";
        const responseMessage: Message = { 
          id: `${frameId}-unclear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          content: reply, 
          sender: "assistant", 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, responseMessage]);
        return reply;
      }
  
      // Handle JSON instructions
      try {
        const instruction = JSON.parse(command);
        const reply = await executeInstruction(instruction);
        const responseMessage: Message = { 
          id: `${frameId}-json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          content: reply, 
          sender: "assistant", 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, responseMessage]);
        return reply;
      } catch (jsonError) {
        // Not JSON, continue with other processing
      }
      
      // Default response for unhandled commands
      const reply = "Please use 'build: ```lang\\ncode```' format or send a specific instruction.";
      const responseMessage: Message = { 
        id: `${frameId}-default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: reply, 
        sender: "assistant", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, responseMessage]);
      return reply;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const reply = `Error: ${errorMsg}. Please clarify your build request.`;
      const responseMessage: Message = { 
        id: `${frameId}-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: reply, 
        sender: "assistant", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, responseMessage]);
      return reply;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const addMessage = (msg: string) => {
    if (msg.includes("build") || msg.includes("sandbox") || msg.includes("ART created") || 
        msg.includes("Test it") || msg.includes("Fix:")) {
      const newMessage: Message = { 
        id: `${frameId}-addmsg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: msg, 
        sender: "user", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Auto-process Test it and Fix commands
      if (msg.includes("Test it") || msg.includes("Fix:")) {
        processCommand(msg).catch(console.error);
      }
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] Ignoring: ${msg.substring(0, 30)}...`);
    }
  };

  const sendToFrame = (targetFrameId: string, message: string) => {
    if (!chatRefs?.current[targetFrameId]?.addMessage) {
      const errorMessage: Message = { 
        id: Date.now().toString(), 
        content: `Error: No chat in ${targetFrameId}`, 
        sender: "assistant", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    if (targetFrameId === frameId) {
      const errorMessage: Message = { 
        id: Date.now().toString(), 
        content: "Error: Cannot send to self.", 
        sender: "assistant", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    chatRefs.current[targetFrameId].addMessage(`From ${frameId}: ${message}`);
    const sentMessage: Message = { 
      id: Date.now().toString(), 
      content: `Sent to ${targetFrameId}: ${message}`, 
      sender: "user", 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, sentMessage]);
    setInput("");
  };

  useImperativeHandle(ref, () => ({ processCommand, addMessage }));

  const handleSendToFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && targetFrame) sendToFrame(targetFrame, input);
  };

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Executor" icon={<Terminal className="h-4 w-4" />}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground max-w-[80%] rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse" />
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse delay-150" />
                  <div className="h-2 w-2 bg-current rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>
        {isTargeted && (
          <div className="p-2 border-t border-muted">
            <form onSubmit={handleSendToFrame} className="flex space-x-2">
              <Select value={targetFrame} onValueChange={setTargetFrame}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Target" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="frame1">Frame 1</SelectItem>
                  <SelectItem value="frame2">Frame 2</SelectItem>
                  <SelectItem value="frame3">Frame 3</SelectItem>
                  <SelectItem value="frame4">Frame 4</SelectItem>
                </SelectContent>
              </Select>
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Send command..." className="flex-1" />
              <Button type="submit" size="icon" disabled={!targetFrame || !input.trim()}><ArrowRight className="h-4 w-4" /></Button>
            </form>
          </div>
        )}
        {!isTargeted && (
          <div className="py-3 text-center text-sm text-muted-foreground border border-dashed rounded-md">
            Click to target this executor frame
          </div>
        )}
      </div>
    </BaseModule>
  );
});

ExecutorChatModule.displayName = "ExecutorChatModule";
export default ExecutorChatModule;
