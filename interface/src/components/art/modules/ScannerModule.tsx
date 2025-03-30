
import React from 'react';
import { Search } from 'lucide-react';
import BaseModule from './BaseModule';

interface ScannerModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const ScannerModule = ({ frameId, isTargeted }: ScannerModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Scanner"
      icon={<Search className="h-4 w-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Search className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Blockchain Scanner</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search, analyze and monitor blockchain transactions and data.
        </p>
        <p className="text-xs text-muted-foreground">
          Connect to specific blockchains using the command line.
        </p>
      </div>
    </BaseModule>
  );
};

export default ScannerModule;
