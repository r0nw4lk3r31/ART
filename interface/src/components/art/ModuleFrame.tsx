
import React from 'react';
import { X } from 'lucide-react';
import { ModuleType } from '@/types/artTypes';
import ChatModule from './modules/ChatModule';
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
import { useToast } from '@/hooks/use-toast';

interface ModuleFrameProps {
  id: string;
  moduleType: ModuleType;
  onChangeModule: (moduleType: ModuleType) => void;
  onRemoveModule: () => void;
  isTargeted: boolean;
  setTargetFrame: (frameId: string) => void;
}

const ModuleFrame = ({ 
  id, 
  moduleType, 
  onChangeModule, 
  onRemoveModule,
  isTargeted,
  setTargetFrame 
}: ModuleFrameProps) => {
  const { toast } = useToast();

  const handleClick = () => {
    setTargetFrame(id);
  };

  const renderModule = () => {
    switch (moduleType) {
      case 'chat':
        return <ChatModule frameId={id} isTargeted={isTargeted} />;
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
      default:
        return <div className="text-muted-foreground text-sm">Unknown module type</div>;
    }
  };

  return (
    <div 
      className={`module-frame animate-fade-in ${isTargeted ? 'ring-2 ring-art-accent' : ''}`}
      onClick={handleClick}
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
      <div className="flex-1 overflow-auto">
        {renderModule()}
      </div>
    </div>
  );
};

export default ModuleFrame;
