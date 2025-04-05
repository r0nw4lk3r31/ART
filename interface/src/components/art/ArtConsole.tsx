import React, { useState, useEffect } from 'react';
import { Calendar, Command, Divide, Globe, Layers, LayoutGrid, MailOpen, Maximize, MessageSquare, Search, Settings, Sun, Watch, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutMode, ModuleState, ModuleType } from '@/types/artTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  nanoGptModel: string;
  setNanoGptModel: (model: string) => void;
  setTargetFrame: (frameId: string) => void;
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
  onCommandSubmit,
  nanoGptModel,
  setNanoGptModel,
  setTargetFrame
}: ArtConsoleProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [weather, setWeather] = useState<{ temp: string; condition: string }>({ temp: 'Loading...', condition: '' });
  const [selectedModule, setSelectedModule] = useState<ModuleType>('chat');
  const [nanoGptModels, setNanoGptModels] = useState<{ id: string; object: string; created: number; owned_by: string }[]>([]);
  const [nanoGptBalance, setNanoGptBalance] = useState<{ balance: string; receivable: string; earned: string } | null>(null);

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
        if (data.data && data.data.length > 0 && !nanoGptModel) {
          setNanoGptModel(data.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching NanoGPT models:', error);
        setNanoGptModels([]);
      }
    };
    fetchNanoGptModels();
  }, []);

  // Fetch NanoGPT balance
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
        earned: data.earned
      });
    } catch (error) {
      console.error('Error fetching NanoGPT balance:', error);
      setNanoGptBalance(null);
    }
  };

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

  // Update weather
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
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommandSubmit(command);
      setCommand(''); // Clear the command input after submission
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-console-muted">
                <Settings size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-console-muted border-console-border">
              <div className="space-y-4 p-2">
                <div>
                  <label className="text-sm text-console-fg mb-1 block">API Source</label>
                  <Select value={selectedApi} onValueChange={setSelectedApi}>
                    <SelectTrigger className="w-full bg-console-bg border-console-border">
                      <SelectValue placeholder="Select API" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Offline">Offline (default)</SelectItem>
                      <SelectItem value="Grok">Grok</SelectItem>
                      <SelectItem value="NanoGPT">NanoGPT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedApi === 'NanoGPT' && (
                  <>
                    <div>
                      <label className="text-sm text-console-fg mb-1 block">NanoGPT Model</label>
                      <Select value={nanoGptModel} onValueChange={setNanoGptModel}>
                        <SelectTrigger className="w-full bg-console-bg border-console-border">
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
        <form onSubmit={handleCommandSubmitLocal} className="flex-1">
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
            <SelectItem value="executor-chat">Executor Chat</SelectItem> {/* Added executor-chat */}
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
