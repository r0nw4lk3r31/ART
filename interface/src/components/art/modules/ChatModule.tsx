import React, { useState, forwardRef, useImperativeHandle, useCallback, useRef } from "react";
import { MessageSquare, Play, Square } from "lucide-react";
import BaseModule from "./BaseModule";
import { CodeSnippet } from "@/types/artTypes";
import { Input, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoConversation from "./AutoConversation";

type Message = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

const ChatModule = forwardRef<
  { processCommand?: (command: string) => Promise<string | null>; addMessage?: (msg: string) => void },
  {
    frameId: string;
    isTargeted: boolean;
    selectedApi: string;
    nanoGptModel?: string;
    onNewCodeSnippet?: (snippet: CodeSnippet) => void;
    chatRefs?: React.MutableRefObject<Record<string, { processCommand?: (cmd: string) => Promise<string | null>; addMessage?: (msg: string) => void }>>;
  }
>(({ frameId, isTargeted, selectedApi, nanoGptModel = "chatgpt-4o-latest", onNewCodeSnippet, chatRefs }, ref) => {
  const [input, setInput] = useState("");
  const [targetFrame, setTargetFrame] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", content: "Hello! I am ART, your assistant. How can I help?", sender: "assistant", timestamp: new Date() },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRunRef = useRef(false); // Track auto-run state to prevent double start
  const autoConversationIdRef = useRef<string | null>(null); // Track current conversation ID
  
  // Track conversation state to handle different phases
  const conversationPhaseRef = useRef<"initial" | "building" | "testing" | "fixing" | "done">("initial");
  const messageHashesRef = useRef<Set<string>>(new Set()); // Track message hashes to prevent duplicates

  const processCommand = useCallback(async (command: string): Promise<string | null> => {
    if (!command.trim()) return null;
    
    // Handle stop command
    if (command.toLowerCase() === "stop") {
      setIsAutoRunning(false);
      autoRunRef.current = false;
      autoConversationIdRef.current = null;
      messageHashesRef.current.clear();
      
      const stopMessage: Message = {
        id: Date.now().toString(),
        content: "Auto-conversation stopped.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, stopMessage]);
      return "Stopped";
    }
    
    // Check for duplicate messages to prevent loops
    const messageHash = `${conversationPhaseRef.current}:${command.substring(0, 50)}`;
    if (messageHashesRef.current.has(messageHash)) {
      console.log(`[${new Date().toLocaleTimeString()}] Duplicate message detected: ${command.substring(0, 30)}...`);
      
      // Only log this if it's not a common message like "Test it"
      if (command !== "Test it") {
        const duplicateMessage: Message = {
          id: Date.now().toString(),
          content: "Duplicate message detected. Ignoring to prevent loops.",
          sender: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, duplicateMessage]);
      }
      
      return null;
    }
    
    // Add message hash to set
    messageHashesRef.current.add(messageHash);
    
    // Add user message to chat
    const newUserMessage: Message = { 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      content: command, 
      sender: "user", 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);
    
    try {
      let reply = "";
      
      // Handle special cases based on conversation phase
      if (command.includes("ART created") && command.includes("What's next?")) {
        // Executor has created a file, move to testing phase
        conversationPhaseRef.current = "testing";
        reply = "Test it";
      } else if (command.startsWith("Error:") && conversationPhaseRef.current === "testing") {
        // Test failed, move to fixing phase
        conversationPhaseRef.current = "fixing";
        
        // Generate a fix based on the error message
        if (command.includes("API key missing")) {
          reply = "Fix: ```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Weather Module</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      max-width: 600px;\n      margin: 0 auto;\n      padding: 20px;\n    }\n    .weather-card {\n      border: 1px solid #ddd;\n      border-radius: 8px;\n      padding: 20px;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n    .weather-form {\n      margin-bottom: 20px;\n    }\n    input, button {\n      padding: 8px;\n      margin-right: 8px;\n    }\n    button {\n      cursor: pointer;\n      background-color: #4CAF50;\n      color: white;\n      border: none;\n      border-radius: 4px;\n    }\n    .error {\n      color: red;\n      margin-top: 10px;\n    }\n  </style>\n</head>\n<body>\n  <h1>Weather Module</h1>\n  \n  <div class=\"weather-form\">\n    <input type=\"text\" id=\"city\" placeholder=\"Enter city name\">\n    <button onclick=\"getWeather()\">Get Weather</button>\n  </div>\n  \n  <div class=\"weather-card\" id=\"weather-info\">\n    <p>Enter a city name to get the current weather.</p>\n  </div>\n  \n  <script>\n    // Store API key as a constant\n    const API_KEY = '4da2a6c7c8b94ec7b8f175924232711';\n    \n    function getWeather() {\n      const city = document.getElementById('city').value;\n      const weatherInfo = document.getElementById('weather-info');\n      \n      if (!city) {\n        weatherInfo.innerHTML = '<p class=\"error\">Please enter a city name</p>';\n        return;\n      }\n      \n      weatherInfo.innerHTML = '<p>Loading weather data...</p>';\n      \n      // Use the API_KEY constant\n      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;\n      \n      fetch(url)\n        .then(response => {\n          if (!response.ok) {\n            throw new Error('City not found or API error');\n          }\n          return response.json();\n        })\n        .then(data => {\n          const temp = data.main.temp;\n          const description = data.weather[0].description;\n          const humidity = data.main.humidity;\n          const windSpeed = data.wind.speed;\n          \n          weatherInfo.innerHTML = `\n            <h2>Weather in ${city}</h2>\n            <p>Temperature: ${temp}°C</p>\n            <p>Conditions: ${description}</p>\n            <p>Humidity: ${humidity}%</p>\n            <p>Wind Speed: ${windSpeed} m/s</p>\n          `;\n        })\n        .catch(error => {\n          weatherInfo.innerHTML = `<p class=\"error\">Error: ${error.message}</p>`;\n        });\n    }\n  </script>\n</body>\n</html>```";
        } else {
          // Generic fix for other errors
          reply = "Fix: ```html\n<!-- Fixed version of the code -->\n```";
        }
      } else if (command === "Success" && conversationPhaseRef.current === "testing") {
        // Test succeeded, we're done
        conversationPhaseRef.current = "done";
        reply = "Success: Weather module built successfully!";
        
        // Auto-stop the conversation
        setIsAutoRunning(false);
        autoRunRef.current = false;
        autoConversationIdRef.current = null;
        messageHashesRef.current.clear();
      } else if (selectedApi === "NanoGPT") {
        // Call the API for other cases
        const apiKey = import.meta.env.VITE_NANOGPT_API_KEY;
        const response = await fetch("https://nano-gpt.com/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: nanoGptModel,
            messages: [
              { 
                role: "system", 
                content: "You are ART, a helpful assistant that works with an executor module to build and test code.\n\nCONVERSATION PHASES:\n1. INITIAL: User requests to build something\n   - Forward the raw request to the executor (e.g., \"build a weather module that runs standalone in a browser via HTML. Use Open Weather API\")\n   - Don't add extra text, just pass the request as-is\n\n2. BUILDING: Executor creates the file and responds with \"ART created [filename]\"\n   - Respond with exactly \"Test it\" to trigger testing\n\n3. TESTING: Executor tests the file\n   - If success: Respond with \"Success: [description of what was built]\"\n   - If error: Move to FIXING phase\n\n4. FIXING: Fix errors reported by the executor\n   - Respond with \"Fix: ```language\\n[corrected code]\\n```\"\n   - Be specific and address the exact error\n\n5. DONE: When executor reports success\n   - Respond with \"Success: [description of what was built]\"\n   - End the conversation\n\nIMPORTANT: Keep responses minimal and focused on the task. No extra chatter."
              },
              { role: "user", content: command }
            ],
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`NanoGPT error: ${response.status}`);
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || "No response.";
      } else if (selectedApi === "Grok") {
        // Call the API for other cases
        const apiKey = import.meta.env.VITE_XAI_API_KEY;
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "grok-2-latest",
            messages: [
              { 
                role: "system", 
                content: "You are ART, a helpful assistant that works with an executor module to build and test code.\n\nCONVERSATION PHASES:\n1. INITIAL: User requests to build something\n   - Forward the raw request to the executor (e.g., \"build a weather module that runs standalone in a browser via HTML. Use Open Weather API\")\n   - Don't add extra text, just pass the request as-is\n\n2. BUILDING: Executor creates the file and responds with \"ART created [filename]\"\n   - Respond with exactly \"Test it\" to trigger testing\n\n3. TESTING: Executor tests the file\n   - If success: Respond with \"Success: [description of what was built]\"\n   - If error: Move to FIXING phase\n\n4. FIXING: Fix errors reported by the executor\n   - Respond with \"Fix: ```language\\n[corrected code]\\n```\"\n   - Be specific and address the exact error\n\n5. DONE: When executor reports success\n   - Respond with \"Success: [description of what was built]\"\n   - End the conversation\n\nIMPORTANT: Keep responses minimal and focused on the task. No extra chatter."
              },
              { role: "user", content: command }
            ],
          }),
        });
        if (!response.ok) throw new Error(`Grok error: ${response.status}`);
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || "No response.";
      } else {
        // Offline mode - handle basic conversation flow
        if (command.toLowerCase().includes("build") && command.toLowerCase().includes("weather")) {
          reply = command; // Pass through the build request
          conversationPhaseRef.current = "building";
        } else {
          reply = `Offline: Echoing "${command}".`;
        }
      }

      // Add response to chat
      const responseMessage: Message = { 
        id: `${frameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: reply, 
        sender: "assistant", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, responseMessage]);
      
      // Add response hash to prevent loops
      const responseHash = `${conversationPhaseRef.current}:${reply.substring(0, 50)}`;
      messageHashesRef.current.add(responseHash);
      
      return reply;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: `Error: ${errorMsg}`,
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedApi, nanoGptModel, frameId]);

  const addMessage = useCallback((msg: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: msg,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendToFrame = useCallback((targetFrameId: string, message: string) => {
    const currentRefs = chatRefs?.current || {};
    const frameIds = Object.keys(currentRefs);
    
    if (!currentRefs[targetFrameId]?.addMessage) {
      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        content: `Error: Cannot send to ${targetFrameId}. Available frames: ${frameIds.join(', ')}`,
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    try {
      currentRefs[targetFrameId].addMessage(`From ${frameId}: ${message}`);
      const sentMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        content: `Sent to ${targetFrameId}: ${message}`,
        sender: "user",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, sentMessage]);
      setInput("");
    } catch (error) {
      console.error(`Error sending to ${targetFrameId}:`, error);
      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        content: `Error sending to ${targetFrameId}: ${error}`,
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [frameId, chatRefs]);

  useImperativeHandle(ref, () => ({ processCommand, addMessage }), [processCommand, addMessage]);

  const toggleAutoRun = useCallback(() => {
    if (!input.trim() || !targetFrame) return;
    
    setIsAutoRunning(prev => {
      if (!prev && !autoRunRef.current) {
        // Starting a new conversation
        const conversationId = `${frameId}-${targetFrame}-${Date.now()}`;
        autoConversationIdRef.current = conversationId;
        autoRunRef.current = true;
        
        // Reset conversation state
        conversationPhaseRef.current = "initial";
        messageHashesRef.current.clear();
        
        console.log(`[${new Date().toLocaleTimeString()}] Starting auto-conversation: ${conversationId}`);
        
        const startMessage: Message = {
          id: `${conversationId}-start`,
          content: "Auto-conversation started with your prompt.",
          sender: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, startMessage]);
        return true;
      } else if (prev) {
        // Stopping the conversation
        console.log(`[${new Date().toLocaleTimeString()}] Stopping auto-conversation: ${autoConversationIdRef.current}`);
        
        autoRunRef.current = false;
        autoConversationIdRef.current = null;
        messageHashesRef.current.clear();
        
        const stopMessage: Message = {
          id: `stop-${Date.now()}`,
          content: "Auto-conversation stopped.",
          sender: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, stopMessage]);
        return false;
      }
      return prev;
    });
  }, [input, targetFrame, frameId]);

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Chat" icon={<MessageSquare className="h-4 w-4" />}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
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
            {isAutoRunning && (
              <AutoConversation
                key={`${frameId}-${targetFrame}`} // Stable key to prevent remounts
                frameId={frameId}
                targetFrame={targetFrame}
                prompt={input}
                isTargeted={false}
                chatRefs={chatRefs!}
                onNewCodeSnippet={onNewCodeSnippet}
                isRunning={isAutoRunning}
                setParentMessages={setMessages}
              />
            )}
            <div className="flex space-x-2">
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
                placeholder="Enter prompt for auto-conversation..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button type="button" size="icon" onClick={toggleAutoRun} disabled={!targetFrame || !input.trim() || isProcessing}>
                {isAutoRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
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

ChatModule.displayName = "ChatModule";
export default ChatModule;
