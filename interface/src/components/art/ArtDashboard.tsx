import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedApi, setSelectedApi] = useState<string>('Offline');
  const [nanoGptModel, setNanoGptModel] = useState<string>('chatgpt-4o-latest');
  const [consoleHeight, setConsoleHeight] = useState<number>(112);
  const { toast } = useToast();
  const chatModuleRef = useRef<{ processCommand?: (cmd: string) => void }>({});

  useEffect(() => {
    const updateDimensions = () => {
      const consoleDivElement = document.querySelector('.console-wrapper');
      if (consoleDivElement) {
        const height = consoleDivElement.clientHeight;
        setConsoleHeight(height);
      }
    };
    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getLayoutClass = () => {
    switch (layoutMode) {
      case 'fullscreen': return 'grid grid-cols-1 grid-rows-1 h-full';
      case 'split': return 'grid grid-cols-2 grid-rows-1 h-full';
      case 'quad': return 'grid grid-cols-2 grid-rows-2 h-full';
      default: return 'grid grid-cols-2 grid-rows-1 h-full';
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
    toast({ title: 'Module Changed', description: `${frameId} is now ${moduleType}` });
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
    toast({ title: 'Module Reset', description: `${frameId} reset to chat` });
  };

  const handleCommandSubmit = (command: string) => {
    console.log(`Command to ${targetFrame}: ${command}`);
    if (modules[targetFrame].type === 'chat' && chatModuleRef.current.processCommand) {
      chatModuleRef.current.processCommand(command);
    }
    setCommand('');
    toast({ title: 'Command Sent', description: `"${command}" to ${modules[targetFrame].type}` });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden m-0 p-0">
      <div 
        className={getLayoutClass()}
        style={{ height: `calc(100vh - ${consoleHeight}px)` }}
      >
        {layoutMode === 'fullscreen' && (
          <ModuleFrame 
            id="frame1" 
            moduleType={modules.frame1.type}
            onChangeModule={(moduleType) => handleChangeModule('frame1', moduleType)}
            onRemoveModule={() => handleRemoveModule('frame1')}
            isTargeted={targetFrame === 'frame1'}
            setTargetFrame={setTargetFrame}
            ref={modules.frame1.type === 'chat' ? chatModuleRef : null}
            selectedApi={selectedApi}
            nanoGptModel={nanoGptModel}
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
              ref={modules.frame1.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
            />
            <ModuleFrame 
              id="frame2" 
              moduleType={modules.frame2.type}
              onChangeModule={(moduleType) => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame2.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
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
              ref={modules.frame1.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
            />
            <ModuleFrame 
              id="frame2" 
              moduleType={modules.frame2.type}
              onChangeModule={(moduleType) => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame2.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
            />
            <ModuleFrame 
              id="frame3" 
              moduleType={modules.frame3.type}
              onChangeModule={(moduleType) => handleChangeModule('frame3', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame3')}
              isTargeted={targetFrame === 'frame3'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame3.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
            />
            <ModuleFrame 
              id="frame4" 
              moduleType={modules.frame4.type}
              onChangeModule={(moduleType) => handleChangeModule('frame4', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame4')}
              isTargeted={targetFrame === 'frame4'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame4.type === 'chat' ? chatModuleRef : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
            />
          </>
        )}
      </div>
      <div className="console-wrapper m-0 p-0 flex-shrink-0">
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
          nanoGptModel={nanoGptModel}
          setNanoGptModel={setNanoGptModel}
          setTargetFrame={setTargetFrame}
        />
      </div>
    </div>
  );
};

export default ArtDashboard;