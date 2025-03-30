
import React, { useState, useEffect } from 'react';
import ArtConsole from './ArtConsole';
import ModuleFrame from './ModuleFrame';
import { LayoutMode, ModuleType, ModuleState } from '@/types/artTypes';
import { useToast } from '@/hooks/use-toast';

const ArtDashboard = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [modules, setModules] = useState<ModuleState>({
    frame1: { id: 'frame1', type: 'chat', title: 'Chat' },
    frame2: { id: 'frame2', type: 'agenda', title: 'Agenda' },
    frame3: { id: 'frame3', type: 'email', title: 'Email' },
    frame4: { id: 'frame4', type: 'routeplanner', title: 'Route Planner' },
  });
  const [targetFrame, setTargetFrame] = useState<string>('frame1');
  const [command, setCommand] = useState<string>('');
  const [selectedApi, setSelectedApi] = useState<string>('openai');
  const [consoleHeight, setConsoleHeight] = useState<number>(112); // Default console height
  const { toast } = useToast();

  // Calculate available height for frames on component mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      const consoleDivElement = document.querySelector('.console-wrapper');
      if (consoleDivElement) {
        const height = consoleDivElement.clientHeight;
        setConsoleHeight(height);
      }
    };

    // Initial calculation
    setTimeout(updateDimensions, 100);
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getLayoutClass = () => {
    switch (layoutMode) {
      case 'fullscreen':
        return 'grid-cols-1 grid-rows-1';
      case 'split':
        return 'grid-cols-2 grid-rows-1';
      case 'quad':
        return 'grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-2 grid-rows-1';
    }
  };

  const handleChangeModule = (frameId: string, moduleType: ModuleType) => {
    setModules(prev => ({
      ...prev,
      [frameId]: { 
        ...prev[frameId],
        type: moduleType, 
        title: moduleType.charAt(0).toUpperCase() + moduleType.slice(1)
      }
    }));

    toast({
      title: 'Module Changed',
      description: `${frameId} is now displaying ${moduleType}`,
    });
  };

  const handleRemoveModule = (frameId: string) => {
    const defaultModule: ModuleType = 'chat';
    
    setModules(prev => ({
      ...prev,
      [frameId]: { 
        ...prev[frameId],
        type: defaultModule,
        title: defaultModule.charAt(0).toUpperCase() + defaultModule.slice(1)
      }
    }));

    toast({
      title: 'Module Reset',
      description: `${frameId} has been reset to the chat module`,
    });
  };

  const handleCommandSubmit = (command: string) => {
    // Process command and direct it to the targeted module
    console.log(`Command submitted to ${targetFrame}: ${command}`);
    setCommand('');
    
    // In a real implementation, this would parse the command and dispatch to modules
    toast({
      title: 'Command Sent',
      description: `"${command}" sent to ${modules[targetFrame].type} module`,
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <div 
        className={`grid flex-1 gap-4 p-4 ${getLayoutClass()} transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ height: `calc(100vh - ${consoleHeight}px)` }} // Dynamic height calculation based on console height
      >
        {layoutMode === 'fullscreen' && (
          <ModuleFrame 
            id="frame1" 
            moduleType={modules.frame1.type}
            onChangeModule={(moduleType) => handleChangeModule('frame1', moduleType)}
            onRemoveModule={() => handleRemoveModule('frame1')}
            isTargeted={targetFrame === 'frame1'}
            setTargetFrame={setTargetFrame}
          />
        )}
        
        {layoutMode === 'split' && (
          <>
            <ModuleFrame 
              id="frame1" 
              moduleType={modules.frame1.type}
              onChangeModule={(moduleType) => handleChangeModule('frame1', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame1')}
              isTargeted={targetFrame === 'frame1'}
              setTargetFrame={setTargetFrame}
            />
            <ModuleFrame 
              id="frame2" 
              moduleType={modules.frame2.type}
              onChangeModule={(moduleType) => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
            />
          </>
        )}
        
        {layoutMode === 'quad' && (
          <>
            <ModuleFrame 
              id="frame1" 
              moduleType={modules.frame1.type}
              onChangeModule={(moduleType) => handleChangeModule('frame1', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame1')}
              isTargeted={targetFrame === 'frame1'}
              setTargetFrame={setTargetFrame}
            />
            <ModuleFrame 
              id="frame2" 
              moduleType={modules.frame2.type}
              onChangeModule={(moduleType) => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
            />
            <ModuleFrame 
              id="frame3" 
              moduleType={modules.frame3.type}
              onChangeModule={(moduleType) => handleChangeModule('frame3', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame3')}
              isTargeted={targetFrame === 'frame3'}
              setTargetFrame={setTargetFrame}
            />
            <ModuleFrame 
              id="frame4" 
              moduleType={modules.frame4.type}
              onChangeModule={(moduleType) => handleChangeModule('frame4', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame4')}
              isTargeted={targetFrame === 'frame4'}
              setTargetFrame={setTargetFrame}
            />
          </>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-10 console-wrapper">
        <ArtConsole 
          layoutMode={layoutMode} 
          setLayoutMode={setLayoutMode}
          targetFrame={targetFrame}
          modules={modules}
          onChangeModule={handleChangeModule}
          command={command}
          setCommand={setCommand}
          selectedApi={selectedApi}
          setSelectedApi={setSelectedApi}
          onCommandSubmit={handleCommandSubmit}
        />
      </div>
    </div>
  );
};

export default ArtDashboard;
