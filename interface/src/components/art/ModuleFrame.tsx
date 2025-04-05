import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import { ModuleType, CodeSnippet } from '@/types/artTypes';
import ChatModule from './modules/ChatModule';
import CodingModule from './modules/CodingModule';
import EmailModule from './modules/EmailModule';
import AgendaModule from './modules/AgendaModule';
import TodoModule from './modules/TodoModule';
import RoutePlannerModule from './modules/RoutePlannerModule';
import TradingModule from './modules/TradingModule';
import StatsModule from './modules/StatsModule';
import HomeAssistantModule from './modules/HomeAssistantModule';
import BrowserModule from './modules/BrowserModule';
import NewsModule from './modules/NewsModule';
import BlockchainModule from './modules/BlockchainModule';
import ScannerModule from './modules/ScannerModule';
import ExecutorChatModule from './modules/ExecutorChatModule';
import { useToast } from '@/hooks/use-toast';

interface ModuleFrameProps {
  id: string;
  moduleType: ModuleType;
  onChangeModule: (moduleType: ModuleType) => void;
  onRemoveModule: () => void;
  isTargeted: boolean;
  setTargetFrame: (frameId: string) => void;
  selectedApi: string;
  nanoGptModel?: string;
  onNewCodeSnippet?: (snippet: CodeSnippet) => void;
  codeSnippets?: CodeSnippet[];
  onSendToChat?: (content: string) => void; // Add missing prop
  className?: string; // Add missing prop
}

// Use the same ref type as in ArtDashboard
type ModuleRef = {
  processCommand?: (cmd: string) => void;
  addMessage?: (msg: string) => void;
};

const ModuleFrame = forwardRef<ModuleRef, ModuleFrameProps>(({
  id, 
  moduleType, 
  onChangeModule, 
  onRemoveModule,
  isTargeted,
  setTargetFrame,
  selectedApi,
  nanoGptModel,
  onNewCodeSnippet,
  codeSnippets
}, ref) => {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setTargetFrame(id);
  };

  const renderModule = () => {
    switch (moduleType) {
      case 'chat':
        return (
          <ChatModule 
            ref={ref} 
            frameId={id} 
            isTargeted={isTargeted} 
            selectedApi={selectedApi} 
            nanoGptModel={nanoGptModel} 
            onNewCodeSnippet={onNewCodeSnippet}
          />
        );
      case 'coding':
        return <CodingModule frameId={id} isTargeted={isTargeted} codeSnippets={codeSnippets} />;
      case 'email':
        return <EmailModule frameId={id} isTargeted={isTargeted} />;
      case 'agenda':
        return <AgendaModule frameId={id} isTargeted={isTargeted} />;
      case 'todo':
        return <TodoModule frameId={id} isTargeted={isTargeted} />;
      case 'routeplanner':
        return <RoutePlannerModule frameId={id} isTargeted={isTargeted} />;
      case 'trading':
        return <TradingModule frameId={id} isTargeted={isTargeted} />;
      case 'stats':
        return <StatsModule frameId={id} isTargeted={isTargeted} />;
      case 'homeassistant':
        return <HomeAssistantModule frameId={id} isTargeted={isTargeted} />;
      case 'browser':
        return <BrowserModule frameId={id} isTargeted={isTargeted} />;
      case 'news':
        return <NewsModule frameId={id} isTargeted={isTargeted} />;
      case 'blockchain':
        return <BlockchainModule frameId={id} isTargeted={isTargeted} />;
      case 'scanner':
        return <ScannerModule frameId={id} isTargeted={isTargeted} />;
      case 'executor-chat':
        return (
          <ExecutorChatModule
            frameId={id}
            isTargeted={isTargeted}
            ref={ref}
            selectedApi={selectedApi} // Pass it here
            nanoGptModel={nanoGptModel}
          />
        );
      default:
        return <div className="text-muted-foreground text-sm">Unknown module</div>;
    }
  };

  return (
    <div 
      className={`module-frame animate-fade-in h-full ${isTargeted ? 'ring-2 ring-art-accent' : ''}`}
      onClick={handleClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="module-header">
        <span className="text-sm font-medium capitalize">{moduleType}</span>
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 hover:bg-muted rounded-md"
            onClick={onRemoveModule}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-2rem)] overflow-y-auto">
        {renderModule()}
      </div>
    </div>
  );
});

ModuleFrame.displayName = 'ModuleFrame';

export default ModuleFrame;
