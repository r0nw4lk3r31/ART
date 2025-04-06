import React, { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square } from "lucide-react";
import BaseModule from "./BaseModule";
import { Button } from "@/components/ui";
import { CodeSnippet } from "@/types/artTypes";

type MessageType = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

// Define conversation phases for state machine
type ConversationPhase = "idle" | "building" | "testing" | "fixing" | "done";

// Global singleton lock for all auto-conversations with a timestamp to detect stale locks
const globalRunningRef = { 
  current: null as string | null,
  timestamp: 0,
  // Method to check if lock is stale (older than 2 minutes)
  isStale: () => {
    if (!globalRunningRef.current) return false;
    return Date.now() - globalRunningRef.timestamp > 120000;
  },
  // Method to acquire lock
  acquire: (id: string) => {
    if (globalRunningRef.current && !globalRunningRef.isStale()) return false;
    globalRunningRef.current = id;
    globalRunningRef.timestamp = Date.now();
    return true;
  },
  // Method to release lock
  release: (id: string) => {
    if (globalRunningRef.current === id) {
      globalRunningRef.current = null;
      return true;
    }
    return false;
  }
};

interface AutoConversationProps {
  frameId: string;
  targetFrame: string;
  prompt: string;
  isTargeted: boolean;
  chatRefs: React.MutableRefObject<Record<string, { processCommand?: (cmd: string) => Promise<string | null>; addMessage?: (msg: string) => void }>>;
  onNewCodeSnippet?: (snippet: CodeSnippet) => void;
  isRunning?: boolean;
  setParentMessages?: (updater: (prev: MessageType[]) => MessageType[]) => void;
}

const AutoConversation: React.FC<AutoConversationProps> = ({ 
  frameId, 
  targetFrame, 
  prompt, 
  isTargeted, 
  chatRefs, 
  onNewCodeSnippet, 
  isRunning: externalIsRunning, 
  setParentMessages 
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [internalIsRunning, setInternalIsRunning] = useState(false);
  const isRunning = externalIsRunning !== undefined ? externalIsRunning : internalIsRunning;
  const [turnCount, setTurnCount] = useState(0);
  
  // Stable ID without timestamp to avoid duplication on remount
  const instanceIdRef = useRef(`${frameId}-${targetFrame}`);
  const conversationStartedRef = useRef(false);
  const startTimeRef = useRef(0);
  
  // Track current file and conversation phase
  const currentFileRef = useRef<string | null>(null);
  const phaseRef = useRef<ConversationPhase>("idle");
  const fixAttemptsRef = useRef(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runConversation = useCallback(async () => {
    // Prevent multiple starts - only one conversation can run globally
    if (!globalRunningRef.acquire(instanceIdRef.current)) {
      console.log(`[${new Date().toLocaleTimeString()}] Conversation ${instanceIdRef.current} blocked - another conversation is running: ${globalRunningRef.current}`);
      return;
    }
    
    // Local lock to prevent the same conversation from running twice
    if (!isRunning || conversationStartedRef.current) {
      globalRunningRef.release(instanceIdRef.current);
      return;
    }
    
    // Record start time and initialize state
    conversationStartedRef.current = true;
    startTimeRef.current = Date.now();
    phaseRef.current = "building"; // Start in building phase
    fixAttemptsRef.current = 0;
    
    // Generate a unique folder name for this conversation to reuse
    const folderName = `${prompt.toLowerCase().includes('weather') ? 'weather' : 
                        prompt.toLowerCase().includes('todo') ? 'todo' : 
                        prompt.toLowerCase().includes('calculator') ? 'calculator' : 
                        'module'}-${startTimeRef.current}`;
    currentFileRef.current = folderName;
    
    console.log(`[${new Date().toLocaleTimeString()}] Starting conversation: ${frameId} -> ${targetFrame} with prompt: ${prompt} (instance ${instanceIdRef.current})`);

    let currentFrame = frameId;
    let nextFrame = targetFrame;
    let lastMessage = prompt;
    const messageCache = new Set<string>();
    let turns = 0;

    try {
      while (isRunning && turns < 5) {
        // Check if we should stop before each turn
        if (!isRunning) {
          console.log(`[${new Date().toLocaleTimeString()}] Stopping conversation - isRunning is false`);
          break;
        }
        
        turns++;
        setTurnCount(turns);
        
        // Log with current phase for better debugging
        console.log(`[${new Date().toLocaleTimeString()}] Turn ${turns} (${phaseRef.current}): ${currentFrame} processing: ${lastMessage.substring(0, 30)}...`);
        
        // Safety check - ensure frames exist
        if (!chatRefs.current[currentFrame]?.processCommand) {
          throw new Error(`Missing processCommand for ${currentFrame}`);
        }
        
        // Process message based on current phase
        let processedMessage = lastMessage;
        
        // Special handling based on phase and frame
        if (phaseRef.current === "building" && currentFrame === frameId && turns === 1) {
          // First turn from ChatModule - send the original prompt
          processedMessage = prompt;
        } 
        else if (phaseRef.current === "building" && currentFrame === targetFrame && 
                 lastMessage.toLowerCase().includes("build") && 
                 !lastMessage.startsWith("build:")) {
          // Convert natural language build request to proper format for ExecutorChatModule
          let moduleType = "generic";
          let moduleTemplate = "";
          
          // Detect project type from the message
          if (lastMessage.toLowerCase().includes("weather")) {
            moduleType = "weather";
          } else if (lastMessage.toLowerCase().includes("todo") || lastMessage.toLowerCase().includes("to do")) {
            moduleType = "todo";
          } else if (lastMessage.toLowerCase().includes("calculator")) {
            moduleType = "calculator";
          } else if (lastMessage.toLowerCase().includes("game")) {
            moduleType = "game";
          } else if (lastMessage.toLowerCase().includes("website") || lastMessage.toLowerCase().includes("web site")) {
            moduleType = "website";
          } else if (lastMessage.toLowerCase().includes("blog")) {
            moduleType = "blog";
          } else if (lastMessage.toLowerCase().includes("chat")) {
            moduleType = "chat";
          } else if (lastMessage.toLowerCase().includes("quiz")) {
            moduleType = "quiz";
          }
          
          // Generate appropriate template based on module type
          if (moduleType === "weather") {
            moduleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Module</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .weather-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .weather-form { margin-bottom: 20px; }
    input, button { padding: 8px; margin-right: 8px; }
    button { cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
    .error { color: red; margin-top: 10px; }
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
          } else if (moduleType === "todo") {
            moduleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo Module</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .todo-container { border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .todo-form { margin-bottom: 20px; display: flex; gap: 8px; }
    input, button { padding: 8px; }
    input { flex: 1; }
    button { cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
    ul { list-style-type: none; padding: 0; }
    li { padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    li:last-child { border-bottom: none; }
    .delete-btn { background-color: #f44336; }
    .edit-btn { background-color: #2196F3; margin-right: 8px; }
    .todo-actions { display: flex; }
    .completed { text-decoration: line-through; color: #888; }
    .todo-item { display: flex; align-items: center; gap: 8px; }
  </style>
</head>
<body>
  <h1>Todo Module</h1>
  
  <div class="todo-container">
    <div class="todo-form">
      <input type="text" id="todo-input" placeholder="Add a new todo">
      <button onclick="addTodo()">Add</button>
    </div>
    
    <ul id="todo-list"></ul>
  </div>
  
  <script>
    // Load todos from localStorage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // Render todos
    function renderTodos() {
      const todoList = document.getElementById('todo-list');
      todoList.innerHTML = '';
      
      todos.forEach((todo, index) => {
        const li = document.createElement('li');
        
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.onchange = () => toggleTodo(index);
        
        const todoText = document.createElement('span');
        todoText.textContent = todo.text;
        if (todo.completed) {
          todoText.className = 'completed';
        }
        
        todoItem.appendChild(checkbox);
        todoItem.appendChild(todoText);
        
        const todoActions = document.createElement('div');
        todoActions.className = 'todo-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editTodo(index);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTodo(index);
        
        todoActions.appendChild(editBtn);
        todoActions.appendChild(deleteBtn);
        
        li.appendChild(todoItem);
        li.appendChild(todoActions);
        
        todoList.appendChild(li);
      });
    }
    
    // Add a new todo
    function addTodo() {
      const todoInput = document.getElementById('todo-input');
      const text = todoInput.value.trim();
      
      if (text) {
        todos.push({ text, completed: false });
        localStorage.setItem('todos', JSON.stringify(todos));
        todoInput.value = '';
        renderTodos();
      }
    }
    
    // Toggle todo completion
    function toggleTodo(index) {
      todos[index].completed = !todos[index].completed;
      localStorage.setItem('todos', JSON.stringify(todos));
      renderTodos();
    }
    
    // Edit a todo
    function editTodo(index) {
      const newText = prompt('Edit todo:', todos[index].text);
      
      if (newText !== null) {
        todos[index].text = newText.trim();
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
      }
    }
    
    // Delete a todo
    function deleteTodo(index) {
      todos.splice(index, 1);
      localStorage.setItem('todos', JSON.stringify(todos));
      renderTodos();
    }
    
    // Initial render
    renderTodos();
    
    // Add todo on Enter key
    document.getElementById('todo-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addTodo();
      }
    });
  </script>
</body>
</html>`;
          } else if (moduleType === "calculator") {
            moduleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculator Module</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px; }
    .calculator { border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .display { width: 100%; margin-bottom: 10px; padding: 10px; font-size: 24px; text-align: right; box-sizing: border-box; }
    .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    button { padding: 15px; font-size: 18px; border: none; border-radius: 4px; cursor: pointer; }
    .number { background-color: #f0f0f0; }
    .operator { background-color: #f8a100; color: white; }
    .equals { background-color: #4CAF50; color: white; }
    .clear { background-color: #f44336; color: white; }
    .zero { grid-column: span 2; }
  </style>
</head>
<body>
  <h1>Calculator</h1>
  
  <div class="calculator">
    <input type="text" class="display" id="display" disabled>
    
    <div class="buttons">
      <button class="clear" onclick="clearDisplay()">C</button>
      <button class="operator" onclick="appendToDisplay('/')">/</button>
      <button class="operator" onclick="appendToDisplay('*')">×</button>
      <button class="operator" onclick="appendToDisplay('-')">-</button>
      
      <button class="number" onclick="appendToDisplay('7')">7</button>
      <button class="number" onclick="appendToDisplay('8')">8</button>
      <button class="number" onclick="appendToDisplay('9')">9</button>
      <button class="operator" onclick="appendToDisplay('+')">+</button>
      
      <button class="number" onclick="appendToDisplay('4')">4</button>
      <button class="number" onclick="appendToDisplay('5')">5</button>
      <button class="number" onclick="appendToDisplay('6')">6</button>
      <button class="operator" onclick="appendToDisplay('%')">%</button>
      
      <button class="number" onclick="appendToDisplay('1')">1</button>
      <button class="number" onclick="appendToDisplay('2')">2</button>
      <button class="number" onclick="appendToDisplay('3')">3</button>
      <button class="equals" onclick="calculate()">=</button>
      
      <button class="number zero" onclick="appendToDisplay('0')">0</button>
      <button class="number" onclick="appendToDisplay('.')">.</button>
    </div>
  </div>
  
  <script>
    const display = document.getElementById('display');
    
    function appendToDisplay(value) {
      display.value += value;
    }
    
    function clearDisplay() {
      display.value = '';
    }
    
    function calculate() {
      try {
        // Replace × with * for calculation
        let expression = display.value.replace('×', '*');
        display.value = eval(expression);
      } catch (error) {
        display.value = 'Error';
      }
    }
  </script>
</body>
</html>`;
          } else {
            // Generic module template
            moduleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generic Module</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .container { border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    button { padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
    input, textarea { padding: 8px; margin-bottom: 10px; width: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <h1>Generic Module</h1>
  
  <div class="container">
    <h2>Module Content</h2>
    <p>This is a generic module template. Customize it based on your needs.</p>
    
    <div id="app">
      <p>Hello, world!</p>
      <button onclick="showMessage()">Click Me</button>
      <div id="message" style="margin-top: 20px;"></div>
    </div>
  </div>
  
  <script>
    function showMessage() {
      const messageElement = document.getElementById('message');
      messageElement.innerHTML = 'Button clicked at ' + new Date().toLocaleTimeString();
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Module initialized');
    });
  </script>
</body>
</html>`;
          }
          
          // Create the build command with the appropriate template
          processedMessage = `build: \`\`\`html\n${moduleTemplate}\`\`\``;
        }
        else if (phaseRef.current === "testing" && currentFrame === frameId) {
          // If we're in the testing phase and this is the ChatModule's turn, explicitly send "Test it"
          processedMessage = "Test it";
        }
        else if (phaseRef.current === "fixing" && currentFrame === frameId && lastMessage.includes("API key missing")) {
          // If we're in the fixing phase and there's an API key error, send a fix
          processedMessage = `Fix: \`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Module</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .weather-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .weather-form { margin-bottom: 20px; }
    input, button { padding: 8px; margin-right: 8px; }
    button { cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
    .error { color: red; margin-top: 10px; }
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
    // Store API key as a constant
    const API_KEY = '4da2a6c7c8b94ec7b8f175924232711';
    
    function getWeather() {
      const city = document.getElementById('city').value;
      const weatherInfo = document.getElementById('weather-info');
      
      if (!city) {
        weatherInfo.innerHTML = '<p class="error">Please enter a city name</p>';
        return;
      }
      
      weatherInfo.innerHTML = '<p>Loading weather data...</p>';
      
      // Use the API_KEY constant
      const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=\${API_KEY}&units=metric\`;
      
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
</html>\`\`\``;
        }
        
        const response = await chatRefs.current[currentFrame].processCommand?.(processedMessage);
        
        // Check for null response or stop conditions
        if (!response) {
          const finalMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-final-${Math.random().toString(36).substr(2, 9)}`, 
            content: "Error: No response received. Stopping auto-conversation.", 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, finalMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, finalMessage]);
          setInternalIsRunning(false);
          conversationStartedRef.current = false;
          if (globalRunningRef.current === instanceIdRef.current) {
            globalRunningRef.current = null;
          }
          break;
        }
        
        // Phase transitions based on responses
        if (response.includes("ART created") && phaseRef.current === "building") {
          // Extract file path for tracking
          const filePathMatch = response.match(/ART created ([^\s.]+)/);
          if (filePathMatch && filePathMatch[1]) {
            currentFileRef.current = filePathMatch[1];
            console.log(`[${new Date().toLocaleTimeString()}] Tracking file: ${currentFileRef.current}`);
          }
          
          // Move to testing phase
          phaseRef.current = "testing";
          
          const buildMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-build-${Math.random().toString(36).substr(2, 9)}`, 
            content: `${response} (Moving to testing phase)`, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, buildMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, buildMessage]);
        } 
        else if (response.startsWith("Error:") && phaseRef.current === "testing") {
          // Move to fixing phase if we get an error during testing
          phaseRef.current = "fixing";
          fixAttemptsRef.current++;
          
          const errorMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-error-${Math.random().toString(36).substr(2, 9)}`, 
            content: `${response} (Moving to fixing phase, attempt ${fixAttemptsRef.current}/3)`, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, errorMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, errorMessage]);
          
          // If we've tried fixing 3 times, stop the conversation
          if (fixAttemptsRef.current >= 3) {
            const maxFixesMessage: MessageType = { 
              id: `${instanceIdRef.current}-${startTimeRef.current}-maxfixes-${Math.random().toString(36).substr(2, 9)}`, 
              content: "Reached maximum fix attempts (3). Stopping auto-conversation.", 
              sender: "assistant", 
              timestamp: new Date() 
            };
            
            setMessages(prev => [...prev, maxFixesMessage]);
            if (setParentMessages) setParentMessages(prev => [...prev, maxFixesMessage]);
            setInternalIsRunning(false);
            conversationStartedRef.current = false;
            if (globalRunningRef.current === instanceIdRef.current) {
              globalRunningRef.current = null;
            }
            break;
          }
        }
        else if (response === "Success" && phaseRef.current === "testing") {
          // Success! We're done
          phaseRef.current = "done";
          
          // Create a success message based on the project type
          let successContent = "Success: Project built successfully!";
          
          // Try to extract the project type from the prompt or file path
          const promptLower = prompt.toLowerCase();
          const filePath = currentFileRef.current || "";
          
          if (promptLower.includes("weather") || filePath.includes("weather")) {
            successContent = "Success: Weather module built successfully!";
          } else if (promptLower.includes("todo") || promptLower.includes("to do") || filePath.includes("todo")) {
            successContent = "Success: Todo application built successfully!";
          } else if (promptLower.includes("calculator") || filePath.includes("calculator")) {
            successContent = "Success: Calculator built successfully!";
          } else if (promptLower.includes("game") || filePath.includes("game")) {
            successContent = "Success: Game built successfully!";
          } else if (promptLower.includes("website") || promptLower.includes("web site") || filePath.includes("website")) {
            successContent = "Success: Website built successfully!";
          } else if (promptLower.includes("blog") || filePath.includes("blog")) {
            successContent = "Success: Blog built successfully!";
          } else if (promptLower.includes("chat") || filePath.includes("chat")) {
            successContent = "Success: Chat application built successfully!";
          } else if (promptLower.includes("quiz") || filePath.includes("quiz")) {
            successContent = "Success: Quiz application built successfully!";
          }
          
          const successMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-success-${Math.random().toString(36).substr(2, 9)}`, 
            content: successContent, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, successMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, successMessage]);
          setInternalIsRunning(false);
          conversationStartedRef.current = false;
          if (globalRunningRef.current === instanceIdRef.current) {
            globalRunningRef.current = null;
          }
          break;
        }
        else if (response.startsWith("Fix:") && phaseRef.current === "fixing") {
          // Move back to testing phase after applying a fix
          phaseRef.current = "testing";
          
          const fixMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-fix-${Math.random().toString(36).substr(2, 9)}`, 
            content: `Applied fix (Moving back to testing phase)`, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, fixMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, fixMessage]);
        }
        
        // Enhanced duplicate detection with phase awareness
        const messageKey = `${currentFrame}:${phaseRef.current}:${response}`;
        if (messageCache.has(messageKey)) {
          console.log(`[${new Date().toLocaleTimeString()}] Duplicate response detected: ${response.substring(0, 30)}...`);
          const duplicateMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-dup-${Math.random().toString(36).substr(2, 9)}`, 
            content: "Detected duplicate response. Stopping auto-conversation to prevent loops.", 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, duplicateMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, duplicateMessage]);
          setInternalIsRunning(false);
          conversationStartedRef.current = false;
          if (globalRunningRef.current === instanceIdRef.current) {
            globalRunningRef.current = null;
          }
          break;
        }
        messageCache.add(messageKey);

        // Add response to messages (if not already handled by phase transitions)
        if (["building", "testing", "fixing"].includes(phaseRef.current)) {
          const newMessage: MessageType = { 
            id: `${instanceIdRef.current}-${startTimeRef.current}-t${turns}-${Math.random().toString(36).substr(2, 9)}`, 
            content: response, 
            sender: "assistant", 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, newMessage]);
          if (setParentMessages) setParentMessages(prev => [...prev, newMessage]);
        }

        // Check target frame exists
        if (!chatRefs.current[nextFrame]?.addMessage) {
          throw new Error(`Missing addMessage for ${nextFrame}`);
        }

        console.log(`[${new Date().toLocaleTimeString()}] Sending to ${nextFrame}: From ${currentFrame}: ${response.substring(0, 30)}...`);
        chatRefs.current[nextFrame].addMessage?.(`From ${currentFrame}: ${response}`);
        lastMessage = response;

        // Switch frames for next turn
        [currentFrame, nextFrame] = [nextFrame, currentFrame];
        console.log(`[${new Date().toLocaleTimeString()}] Waiting 10 seconds before next turn...`);
        await delay(10000); // Increased delay to 10 seconds
      }

      // Max turns reached
      if (turns >= 5 && isRunning) {
        const maxTurnsMessage: MessageType = { 
          id: `${instanceIdRef.current}-${startTimeRef.current}-max-${Math.random().toString(36).substr(2, 9)}`, 
          content: `Auto-conversation reached maximum turn limit (5) and has been stopped.`, 
          sender: "assistant", 
          timestamp: new Date() 
        };
        
        setMessages(prev => [...prev, maxTurnsMessage]);
        if (setParentMessages) setParentMessages(prev => [...prev, maxTurnsMessage]);
        setInternalIsRunning(false);
        conversationStartedRef.current = false;
        if (globalRunningRef.current === instanceIdRef.current) {
          globalRunningRef.current = null;
        }
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error in conversation:`, error);
      const errorMessage: MessageType = { 
        id: `${instanceIdRef.current}-${startTimeRef.current}-error-${Math.random().toString(36).substr(2, 9)}`, 
        content: `Error: ${error instanceof Error ? error.message : String(error)}`, 
        sender: "assistant", 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, errorMessage]);
      if (setParentMessages) setParentMessages(prev => [...prev, errorMessage]);
      setInternalIsRunning(false);
      conversationStartedRef.current = false;
      if (globalRunningRef.current === instanceIdRef.current) {
        globalRunningRef.current = null;
      }
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] Conversation stopped after ${turns} turns`);
  }, [frameId, targetFrame, prompt, isRunning, chatRefs, setParentMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (globalRunningRef.current === instanceIdRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] Unmounting conversation ${instanceIdRef.current} - releasing global lock`);
        globalRunningRef.release(instanceIdRef.current);
      }
    };
  }, []);

  // Handle isRunning changes
  useEffect(() => {
    if (isRunning && !conversationStartedRef.current) {
      setTurnCount(0);
      setMessages([]);
      startTimeRef.current = Date.now();
      runConversation();
    } else if (!isRunning) {
      conversationStartedRef.current = false;
      globalRunningRef.release(instanceIdRef.current);
    }
  }, [isRunning, runConversation]);

  const handleStartStop = () => {
    setInternalIsRunning(prev => {
      if (!prev) {
        setMessages([]);
        conversationStartedRef.current = false;
        startTimeRef.current = Date.now();
        return true;
      }
      // Immediately mark as not running to ensure stop is responsive
      conversationStartedRef.current = false;
      globalRunningRef.release(instanceIdRef.current);
      return false;
    });
  };

  if (!isTargeted) return null;

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Auto Conversation" icon={<Play className="h-4 w-4" />}>
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
        </div>
        <div className="p-2 border-t border-muted">
          <div className="flex justify-between items-center">
            <Button onClick={handleStartStop} variant="outline" size="sm">
              {isRunning ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isRunning ? "Stop" : "Start"}
            </Button>
            {turnCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Turn {turnCount}/5
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseModule>
  );
};

export default AutoConversation;
