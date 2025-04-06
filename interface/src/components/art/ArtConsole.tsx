// ArtConsole.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Command, Divide, Globe, Layers, LayoutGrid, MailOpen, Maximize, MessageSquare, Search, Settings, Sun, Watch, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutMode, ModuleState, ModuleType } from '@/types/artTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ApiStatus {
  name: string;
  isValid: boolean;
}

interface ArtConsoleProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  targetFrame: string;
  modules: ModuleState;
  onChangeModule: (frameId: string, moduleType: ModuleType) => void;
  frameApis: Record<string, string>;
  setFrameApi: (frameId: string, api: string) => void;
  chatRefs: React.MutableRefObject<Record<string, { processCommand?: (cmd: string) => Promise<string | null>; addMessage?: (msg: string) => void }>>;
  setTargetFrame: (frameId: string) => void;
}

const ArtConsole = ({
  layoutMode,
  setLayoutMode,
  targetFrame,
  modules,
  onChangeModule,
  frameApis,
  setFrameApi,
  chatRefs,
  setTargetFrame,
}: ArtConsoleProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [weather, setWeather] = useState<{ temp: string; condition: string }>({ temp: 'Loading...', condition: '' });
  const [selectedModule, setSelectedModule] = useState<ModuleType>('chat');
  
  // Sync selectedModule with the active module in the targeted frame
  useEffect(() => {
    if (targetFrame && modules[targetFrame]) {
      setSelectedModule(modules[targetFrame].type);
    }
  }, [targetFrame, modules]);
  const [command, setCommand] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<ApiStatus[]>([]);
  const [nanoGptModels, setNanoGptModels] = useState<{ id: string; object: string; created: number; owned_by: string }[]>([]); // Restored
  const [nanoGptBalance, setNanoGptBalance] = useState<{ balance: string; receivable: string; earned: string } | null>(null); // Restored

  // Fetch NanoGPT models
  useEffect(() => {
    const fetchNanoGptModels = async () => {
      const apiKey = import.meta.env.VITE_NANOGPT_API_KEY;
      try {
        const response = await fetch('https://nano-gpt.com/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`NanoGPT models fetch failed: ${response.status}`);
        const data = await response.json();
        setNanoGptModels(data.data || []);
      } catch (error) {
        console.error('Error fetching NanoGPT models:', error);
        setNanoGptModels([]);
      }
    };
    fetchNanoGptModels();
  }, []);

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

  // Update weather and API status on mount
  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const lat = 50.8036;
      const lon = 4.8668;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const temp = `${Math.round(data.main.temp)}°C`;
        const condition = data.weather[0].main;
        setWeather({ temp, condition });
      } catch (error) {
        console.error('Weather fetch failed:', error);
        setWeather({ temp: 'N/A', condition: 'Error' });
      }
    };
    fetchWeather();
    checkApiStatus();
    const interval = setInterval(() => {
      fetchWeather();
      checkApiStatus();
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  // Check API health status
  const checkApiStatus = async () => {
    const status: ApiStatus[] = [];
    const grokKey = import.meta.env.VITE_XAI_API_KEY;
    const nanoGptKey = import.meta.env.VITE_NANOGPT_API_KEY;

    if (grokKey) {
      try {
        const response = await fetch('https://api.x.ai/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
        });
        status.push({ name: 'Grok', isValid: response.ok });
      } catch {
        status.push({ name: 'Grok', isValid: false });
      }
    } else {
      status.push({ name: 'Grok', isValid: false });
    }

    if (nanoGptKey) {
      try {
        const response = await fetch('https://nano-gpt.com/api/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${nanoGptKey}`, 'Content-Type': 'application/json' },
        });
        status.push({ name: 'NanoGPT', isValid: response.ok });
      } catch {
        status.push({ name: 'NanoGPT', isValid: false });
      }
    } else {
      status.push({ name: 'NanoGPT', isValid: false });
    }

    setApiStatus(status);
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !targetFrame || !chatRefs.current[targetFrame]?.processCommand) return;

    const cmd = command.trim();
    setCommand('');
    
    // Just call processCommand and let it handle messages internally
    try {
      await chatRefs.current[targetFrame].processCommand(cmd);
      console.log(`Command processed by ${targetFrame}`);
    } catch (error) {
      console.error(`Error processing command in ${targetFrame}:`, error);
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

  const getFrameIds = () => {
    if (layoutMode === 'fullscreen') return ['frame1'];
    if (layoutMode === 'split') return ['frame1', 'frame2'];
    return ['frame1', 'frame2', 'frame3', 'frame4'];
  };

  // Restored NanoGPT balance fetch
  const fetchNanoGptBalance = async () => {
    const apiKey = import.meta.env.VITE_NANOGPT_API_KEY;
    try {
      const response = await fetch('https://nano-gpt.com/api/check-nano-balance', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`NanoGPT balance fetch failed: ${response.status}`);
      const data = await response.json();
      setNanoGptBalance({
        balance: data.balance,
        receivable: data.receivable,
        earned: data.earned,
      });
    } catch (error) {
      console.error('Error fetching NanoGPT balance:', error);
      setNanoGptBalance(null);
    }
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-console-muted">
                <Settings size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-console-muted border-console-border">
              <div className="space-y-4 p-2">
                <div>
                  <label className="text-sm text-console-fg mb-1 block">API Settings</label>
                  {getFrameIds().map(frameId => (
                    <div key={frameId} className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-console-fg w-16">Frame {frameId.slice(-1)}</span>
                      <Select value={frameApis?.[frameId] || "Offline"} onValueChange={api => setFrameApi(frameId, api)}>
                        <SelectTrigger className="w-32 bg-console-bg border-console-border h-8">
                          <SelectValue placeholder="Select API" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Offline">Offline</SelectItem>
                          <SelectItem value="Grok">Grok</SelectItem>
                          <SelectItem value="NanoGPT">NanoGPT</SelectItem>
                        </SelectContent>
                      </Select>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          !frameApis || frameApis[frameId] === 'Offline'
                            ? 'bg-gray-500'
                            : apiStatus.find(s => s.name === frameApis[frameId])?.isValid
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full bg-console-bg border-console-border"
                    onClick={checkApiStatus}
                  >
                    Refresh API Status
                  </Button>
                </div>
                {Object.values(frameApis).includes('NanoGPT') && (
                  <>
                    <div>
                      <label className="text-sm text-console-fg mb-1 block">NanoGPT Model</label>
                      <Select
                        value={nanoGptModels.length > 0 ? nanoGptModels[0].id : undefined} // Default to first model
                        onValueChange={(value) => console.log('Selected NanoGPT model:', value)} // Replace with setter if needed
                      >
                        <SelectTrigger className="w-full bg-console-bg border-console-border h-8">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {nanoGptModels.length > 0 ? (
                            nanoGptModels.map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.id}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading">Loading models...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-console-fg mb-1 block">NanoGPT Balance</label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-console-bg border-console-border"
                        onClick={fetchNanoGptBalance}
                      >
                        <Wallet size={14} className="mr-2" />
                        Check Balance
                      </Button>
                      {nanoGptBalance && (
                        <div className="mt-2 text-xs text-console-fg">
                          <p>Balance: {nanoGptBalance.balance} Nano</p>
                          <p>Receivable: {nanoGptBalance.receivable} Nano</p>
                          <p>Earned: {nanoGptBalance.earned} Nano</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <form onSubmit={handleCommandSubmit} className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
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
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="routeplanner">Route Planner</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
            <SelectItem value="stats">Statistics</SelectItem>
            <SelectItem value="homeassistant">Home Assistant</SelectItem>
            <SelectItem value="browser">Browser</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="blockchain">Blockchain</SelectItem>
            <SelectItem value="scanner">Scanner</SelectItem>
            <SelectItem value="coding">Coding</SelectItem>
            <SelectItem value="executor-chat">Executor Chat</SelectItem>
          </SelectContent>
        </Select>
        <Select value={targetFrame} onValueChange={setTargetFrame}>
          <SelectTrigger className="w-[100px] h-9 bg-console-muted border-console-border">
            <SelectValue placeholder="Select frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frame1">Frame 1</SelectItem>
            {layoutMode !== 'fullscreen' && <SelectItem value="frame2">Frame 2</SelectItem>}
            {layoutMode === 'quad' && (
              <>
                <SelectItem value="frame3">Frame 3</SelectItem>
                <SelectItem value="frame4">Frame 4</SelectItem>
              </>
            )}
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
            <span>{weather.temp} {weather.condition}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtConsole;
