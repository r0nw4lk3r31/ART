
import React from 'react';
import { Home } from 'lucide-react';
import BaseModule from './BaseModule';

interface HomeAssistantModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const HomeAssistantModule = ({ frameId, isTargeted }: HomeAssistantModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Home Assistant"
      icon={<Home className="h-4 w-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Home className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Home Assistant Module</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Control your smart home devices and automation.
        </p>
        <p className="text-xs text-muted-foreground">
          To connect, enter your Home Assistant server details in the command line.
        </p>
      </div>
    </BaseModule>
  );
};

export default HomeAssistantModule;
