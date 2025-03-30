
import React, { useState, useEffect } from 'react';
import { Calendar, Command, Divide, Globe, Layers, LayoutGrid, MailOpen, Maximize, Menu, MessageSquare, Search, Settings, Sun, Thermometer, Watch, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutMode, ModuleState, ModuleType } from '@/types/artTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ArtConsoleProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  targetFrame: string;
  modules: ModuleState;
  onChangeModule: (frameId: string, moduleType: ModuleType) => void;
  command: string;
  setCommand: (command: string) => void;
  selectedApi: string;
  setSelectedApi: (api: string) => void;
  onCommandSubmit: (command: string) => void;
}

const ArtConsole = ({ 
  layoutMode, 
  setLayoutMode,
  targetFrame,
  modules,
  onChangeModule,
  command,
  setCommand,
  selectedApi,
  setSelectedApi,
  onCommandSubmit
}: ArtConsoleProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [weather, setWeather] = useState({ temp: '21°C', condition: 'Sunny' });
  const [selectedModule, setSelectedModule] = useState<ModuleType>('chat');
  
  // Update time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // For demo purposes we'll just simulate weather
  useEffect(() => {
    // In a real app, you would fetch weather data from an API
    const mockWeather = [
      { temp: '21°C', condition: 'Sunny' },
      { temp: '18°C', condition: 'Cloudy' },
      { temp: '15°C', condition: 'Rainy' },
    ];
    
    const randomWeather = mockWeather[Math.floor(Math.random() * mockWeather.length)];
    setWeather(randomWeather);
  }, []);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommandSubmit(command);
    }
  };

  const handleModuleChange = (value: string) => {
    setSelectedModule(value as ModuleType);
    if (targetFrame) {
      onChangeModule(targetFrame, value as ModuleType);
    }
  };

  const toggleLayoutMode = () => {
    const modes: LayoutMode[] = ['fullscreen', 'split', 'quad'];
    const currentIndex = modes.indexOf(layoutMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLayoutMode(modes[nextIndex]);
  };

  return (
    <div className="flex flex-col bg-console p-3 border-t border-console-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="console-button art-glow">
            <Command size={18} className="text-console-accent" />
          </div>
          <span className="ml-2 text-sm font-semibold text-console-accent">ART</span>
          {targetFrame && (
            <span className="ml-2 text-xs text-console-muted">
              Target: <span className="text-console-accent">{modules[targetFrame].type}</span> in {targetFrame}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-md bg-console-muted hover:bg-console-muted"
            onClick={toggleLayoutMode}
          >
            {layoutMode === 'fullscreen' && <Maximize size={14} />}
            {layoutMode === 'split' && <Divide size={14} />}
            {layoutMode === 'quad' && <LayoutGrid size={14} />}
          </Button>
          
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-console-muted">
            <Settings size={14} />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <form onSubmit={handleCommandSubmit} className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-console-muted border-console-border text-sm pl-8"
              placeholder={`Enter a command for ${targetFrame ? modules[targetFrame].type : 'ART'}...`}
            />
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-console-muted" />
          </div>
        </form>
        
        <Select value={selectedModule} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-[140px] h-9 bg-console-muted border-console-border">
            <SelectValue placeholder="Select module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chat"><MessageSquare className="mr-2 h-4 w-4" /> Chat</SelectItem>
            <SelectItem value="email"><MailOpen className="mr-2 h-4 w-4" /> Email</SelectItem>
            <SelectItem value="agenda"><Calendar className="mr-2 h-4 w-4" /> Agenda</SelectItem>
            <SelectItem value="todo"><Layers className="mr-2 h-4 w-4" /> Todo</SelectItem>
            <SelectItem value="routeplanner"><Globe className="mr-2 h-4 w-4" /> Route Planner</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
            <SelectItem value="stats">Statistics</SelectItem>
            <SelectItem value="homeassistant">Home Assistant</SelectItem>
            <SelectItem value="browser">Browser</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="blockchain">Blockchain</SelectItem>
            <SelectItem value="scanner">Scanner</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedApi} onValueChange={setSelectedApi}>
          <SelectTrigger className="w-[140px] h-9 bg-console-muted border-console-border">
            <SelectValue placeholder="Select API" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="ollama">Ollama</SelectItem>
            <SelectItem value="perplexity">Perplexity</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-3 px-3 py-1.5 rounded-md bg-console-muted text-sm">
          <div className="flex items-center">
            <Watch size={14} className="mr-1.5" />
            <span>{currentTime}</span>
          </div>
          <div className="h-3 w-px bg-console-border" />
          <div className="flex items-center">
            <Calendar size={14} className="mr-1.5" />
            <span>{currentDate}</span>
          </div>
          <div className="h-3 w-px bg-console-border" />
          <div className="flex items-center">
            <Sun size={14} className="mr-1.5" />
            <span>{weather.temp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtConsole;
