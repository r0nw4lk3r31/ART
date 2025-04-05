import React, { useState, useRef, useEffect } from 'react';
import ModuleFrame from './ModuleFrame';
import ArtConsole from './ArtConsole';
import { useToast } from '@/hooks/use-toast';
import { LayoutMode, ModuleState, CodeSnippet, ModuleType } from '@/types/artTypes';

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
  // Default selectedApi to "Grok"
  const [selectedApi, setSelectedApi] = useState<string>('Grok');
  console.log('ArtDashboard selectedApi:', selectedApi);
  const [nanoGptModel, setNanoGptModel] = useState<string>('chatgpt-4o-latest');
  const consoleHeight = 112;
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const { toast } = useToast();
  const chatRefs = useRef<Record<string, { processCommand?: (cmd: string) => void; addMessage?: (msg: string) => void }>>({});

  useEffect(() => {
    Object.keys(chatRefs.current).forEach(frameId => {
      if (!modules[frameId]) delete chatRefs.current[frameId];
    });
  }, [modules]);

  const handleChangeModule = (frameId: string, moduleType: ModuleType) => {
    setModules(prev => ({
      ...prev,
      [frameId]: { ...prev[frameId], type: moduleType, title: moduleType.charAt(0).toUpperCase() + moduleType.slice(1) },
    }));
  };

  const handleRemoveModule = (frameId: string) => {
    setModules(prev => {
      const newModules = { ...prev };
      delete newModules[frameId];
      return newModules;
    });
  };

  const handleNewCodeSnippet = (snippet: CodeSnippet) => {
    console.log('New snippet received:', snippet);
    setCodeSnippets(prev => [snippet, ...prev]);
  };

  const handleCommandSubmit = (cmd: string) => {
    if (chatRefs.current[targetFrame]?.processCommand) {
      chatRefs.current[targetFrame].processCommand(cmd);
    } else {
      console.log(`No processCommand for ${targetFrame} (${modules[targetFrame]?.type})`);
    }
  };

  const handleSendToChat = (content: string) => {
    const chatFrame = Object.keys(modules).find(id => modules[id].type === 'chat');
    if (chatFrame && chatRefs.current[chatFrame]?.addMessage) {
      chatRefs.current[chatFrame].addMessage(`Code from CodingModule:\n\`\`\`\n${content}\n\`\`\``);
      toast({ title: 'Code Sent', description: 'Code sent to Chat module' });
    } else {
      toast({ title: 'Error', description: 'No Chat module available' });
    }
  };

  const setChatRef = (frameId: string) => (instance: { processCommand?: (cmd: string) => void; addMessage?: (msg: string) => void } | null) => {
    if (instance) chatRefs.current[frameId] = instance;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden m-0 p-0">
      <div className="w-full" style={{ height: `calc(100vh - ${consoleHeight}px)` }}>
        {layoutMode === 'fullscreen' && (
          <ModuleFrame
            id={targetFrame}
            moduleType={modules[targetFrame].type}
            onChangeModule={moduleType => handleChangeModule(targetFrame, moduleType)}
            onRemoveModule={() => handleRemoveModule(targetFrame)}
            isTargeted={true}
            setTargetFrame={setTargetFrame}
            ref={modules[targetFrame].type === 'chat' || modules[targetFrame].type === 'executor-chat' ? setChatRef(targetFrame) : null}
            selectedApi={selectedApi}
            nanoGptModel={nanoGptModel}
            onNewCodeSnippet={handleNewCodeSnippet}
            codeSnippets={modules[targetFrame].type === 'coding' ? codeSnippets : undefined}
            onSendToChat={modules[targetFrame].type === 'coding' ? handleSendToChat : undefined}
            className="w-full h-full !max-w-none"
          />
        )}
        {layoutMode === 'split' && (
          <div className="flex flex-row w-full h-full">
            <ModuleFrame
              id="frame1"
              moduleType={modules.frame1.type}
              onChangeModule={moduleType => handleChangeModule('frame1', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame1')}
              isTargeted={targetFrame === 'frame1'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame1.type === 'chat' || modules.frame1.type === 'executor-chat' ? setChatRef('frame1') : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
              onNewCodeSnippet={handleNewCodeSnippet}
              codeSnippets={modules.frame1.type === 'coding' ? codeSnippets : undefined}
              onSendToChat={modules.frame1.type === 'coding' ? handleSendToChat : undefined}
              className="w-1/2 h-full !max-w-none"
            />
            <ModuleFrame
              id="frame2"
              moduleType={modules.frame2.type}
              onChangeModule={moduleType => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame2.type === 'chat' || modules.frame2.type === 'executor-chat' ? setChatRef('frame2') : null}
              selectedApi={selectedApi}
              nanoGptModel={nanoGptModel}
              onNewCodeSnippet={handleNewCodeSnippet}
              codeSnippets={modules.frame2.type === 'coding' ? codeSnippets : undefined}
              onSendToChat={modules.frame2.type === 'coding' ? handleSendToChat : undefined}
              className="w-1/2 h-full !max-w-none"
            />
          </div>
        )}
        {layoutMode === 'quad' && (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0">
            {['frame1', 'frame2', 'frame3', 'frame4'].map(frameId => (
              <ModuleFrame
                key={frameId}
                id={frameId}
                moduleType={modules[frameId as keyof ModuleState].type}
                onChangeModule={moduleType => handleChangeModule(frameId, moduleType)}
                onRemoveModule={() => handleRemoveModule(frameId)}
                isTargeted={targetFrame === frameId}
                setTargetFrame={setTargetFrame}
                ref={modules[frameId as keyof ModuleState].type === 'chat' || modules[frameId as keyof ModuleState].type === 'executor-chat' ? setChatRef(frameId) : null}
                selectedApi={selectedApi}
                nanoGptModel={nanoGptModel}
                onNewCodeSnippet={handleNewCodeSnippet}
                codeSnippets={modules[frameId as keyof ModuleState].type === 'coding' ? codeSnippets : undefined}
                onSendToChat={modules[frameId as keyof ModuleState].type === 'coding' ? handleSendToChat : undefined}
                className="w-full h-full !max-w-none"
              />
            ))}
          </div>
        )}
      </div>
      <div className="console-wrapper m-0 p-0 flex-shrink-0" style={{ height: consoleHeight }}>
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