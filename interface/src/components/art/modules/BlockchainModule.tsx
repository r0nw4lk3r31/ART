
import React from 'react';
import { Database } from 'lucide-react';
import BaseModule from './BaseModule';

interface BlockchainModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const BlockchainModule = ({ frameId, isTargeted }: BlockchainModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Blockchain"
      icon={<Database className="h-4 w-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Database className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Blockchain Module</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Secure backup and logging using blockchain technology.
        </p>
        <p className="text-xs text-muted-foreground">
          This module provides immutable storage for important data and logs.
        </p>
      </div>
    </BaseModule>
  );
};

export default BlockchainModule;
