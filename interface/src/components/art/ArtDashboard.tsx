import React, { useState, useRef, useEffect, useCallback } from 'react';
import ModuleFrame from './ModuleFrame';
import ArtConsole from './ArtConsole';
import { useToast } from '@/hooks/use-toast';
import { LayoutMode, ModuleState, CodeSnippet, ModuleType } from '@/types/artTypes';

const ArtDashboard = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [modules, setModules] = useState<ModuleState>({
    frame1: { id: 'frame1', type: 'chat', title: 'Chat' },
    frame2: { id: 'frame2', type: 'chat', title: 'Chat' }, // Change from 'agenda' to 'chat'
    frame3: { id: 'frame3', type: 'email', title: 'Email' },
    frame4: { id: 'frame4', type: 'routeplanner', title: 'Route Planner' },
  });
  const [targetFrame, setTargetFrame] = useState<string>('frame1');
  const [command, setCommand] = useState<string>('');

  // New state for per-frame APIs
  const [frameApis, setFrameApis] = useState<Record<string, string>>({
    frame1: 'Grok',
    frame2: 'Grok',
    frame3: 'Grok',
    frame4: 'Grok',
  });

  const [nanoGptModel, setNanoGptModel] = useState<string>('chatgpt-4o-latest');
  const consoleHeight = 112;
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const { toast } = useToast();
  const chatRefs = useRef<Record<string, { processCommand?: (cmd: string) => Promise<string | null>; addMessage?: (msg: string) => void }>>({});

  // Add this at the top of your component to ensure chatRefs are stable
  const stableRefs = useRef(chatRefs);

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
    setFrameApis(prev => {
      const newApis = { ...prev };
      delete newApis[frameId];
      return newApis;
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

  // Add this to stabilize the chat refs
  const setChatRef = useCallback((frameId: string) => (instance: { 
    processCommand?: (cmd: string) => Promise<string | null>; 
    addMessage?: (msg: string) => void 
  } | null) => {
    if (instance) {
      // Only update if we have both functions or if ref doesn't exist yet
      if ((instance.processCommand && instance.addMessage) || !chatRefs.current[frameId]) {
        chatRefs.current[frameId] = instance;
        console.log(`Chat ref set for ${frameId}: processCommand=${!!instance.processCommand}, addMessage=${!!instance.addMessage}`);
      }
    } else {
      // Fix the syntax error here
      console.log(`Null instance received for ${frameId}, keeping existing ref: ${!!chatRefs.current[frameId]}`);
    }
  }, []);

  // Create a global function for testing chat refs directly
  useEffect(() => {
    // IMPORTANT: This exposes the chatRefs object globally for direct testing
    // @ts-ignore - intentionally exposing for debugging
    window.testChatRefs = {
      getChatRefs: () => chatRefs.current,
      sendTestMessage: (from: string, to: string, msg: string) => {
        const refs = chatRefs.current;
        console.log(`TEST: Sending from ${from} to ${to}`, {
          fromExists: !!refs[from],
          toExists: !!refs[to],
          toHasAddMessage: !!refs[to]?.addMessage,
          allRefs: Object.keys(refs)
        });
        
        if (refs[to]?.addMessage) {
          refs[to].addMessage(`TEST from ${from}: ${msg}`);
          return true;
        }
        return false;
      }
    };
    
    console.log('Added global testChatRefs object for debugging');
  }, []);

  const handleSetFrameApi = (frameId: string, api: string) => {
    setFrameApis(prev => ({ ...prev, [frameId]: api }));
  };

  // Consolidate your debug logging into a single effect
  useEffect(() => {
    // Only enable frequent logging in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // One-time immediate log on mount or when modules change
    console.log('--- ChatRefs Status (Initial) ---');
    Object.keys(modules).forEach(id => {
      console.log(`Frame ${id} (${modules[id]?.type}):`, {
        hasRef: !!chatRefs.current[id],
        hasProcessCommand: !!chatRefs.current[id]?.processCommand,
        hasAddMessage: !!chatRefs.current[id]?.addMessage
      });
    });
    
    // Only set periodic logging if in development
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isDev) {
      // Use a longer interval (15 seconds) to reduce spam
      intervalId = setInterval(() => {
        console.log('--- ChatRefs Periodic Check ---');
        Object.keys(modules).forEach(id => {
          // Only log actual issues to reduce noise
          const moduleType = modules[id]?.type;
          
          // Only check for missing functions in chat modules
          if (moduleType === 'chat' || moduleType === 'executor-chat') {
            const hasRef = !!chatRefs.current[id];
            const hasProcessCommand = !!chatRefs.current[id]?.processCommand;
            const hasAddMessage = !!chatRefs.current[id]?.addMessage;
            
            if (!hasRef || !hasProcessCommand || !hasAddMessage) {
              console.warn(`ISSUE: Chat frame ${id} missing functions:`, {
                hasRef,
                hasProcessCommand,
                hasAddMessage
              });
            }
          }
        });
      }, 15000); // Check every 15 seconds
    }
    
    // Clean up function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [modules]); // Only depend on modules

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
            selectedApi={frameApis[targetFrame] || 'Offline'} // Use per-frame API
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
              ref={modules.frame1.type === 'chat' || modules.frame1.type === 'executor-chat' ? setChatRef('frame1') : undefined}
              selectedApi={frameApis.frame1 || 'Offline'}
              nanoGptModel={nanoGptModel}
              onNewCodeSnippet={handleNewCodeSnippet}
              codeSnippets={modules.frame1.type === 'coding' ? codeSnippets : undefined}
              onSendToChat={modules.frame1.type === 'coding' ? handleSendToChat : undefined}
              chatRefs={chatRefs} // Pass direct ref to ensure it's the same instance
              className="w-1/2 h-full !max-w-none"
            />
            <ModuleFrame
              id="frame2"
              moduleType={modules.frame2.type}
              onChangeModule={moduleType => handleChangeModule('frame2', moduleType)}
              onRemoveModule={() => handleRemoveModule('frame2')}
              isTargeted={targetFrame === 'frame2'}
              setTargetFrame={setTargetFrame}
              ref={modules.frame2.type === 'chat' || modules.frame2.type === 'executor-chat' ? setChatRef('frame2') : undefined}
              selectedApi={frameApis.frame2 || 'Offline'}
              nanoGptModel={nanoGptModel}
              onNewCodeSnippet={handleNewCodeSnippet}
              codeSnippets={modules.frame2.type === 'coding' ? codeSnippets : undefined}
              onSendToChat={modules.frame2.type === 'coding' ? handleSendToChat : undefined}
              chatRefs={chatRefs} // Pass direct ref to ensure it's the same instance
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
                selectedApi={frameApis[frameId] || 'Offline'}
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
          frameApis={frameApis} // Pass frameApis
          setFrameApi={handleSetFrameApi} // Pass setFrameApi
          chatRefs={chatRefs} // Pass chatRefs
          setTargetFrame={setTargetFrame}
        />
      </div>
    </div>
  );
};

export default ArtDashboard;