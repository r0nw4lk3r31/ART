
import React from 'react';
import { Globe } from 'lucide-react';
import BaseModule from './BaseModule';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BrowserModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const BrowserModule = ({ frameId, isTargeted }: BrowserModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Browser"
      icon={<Globe className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex space-x-2 mb-4">
          <Input 
            className="flex-1" 
            placeholder="Enter URL..." 
            disabled={!isTargeted}
          />
          <Button disabled={!isTargeted}>
            Go
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-muted rounded-md p-6 text-center">
          <Globe className="h-16 w-16 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Web Browser</h3>
          <p className="text-sm text-muted-foreground">
            Enter a URL above to browse the web within ART.
          </p>
        </div>
      </div>
    </BaseModule>
  );
};

export default BrowserModule;
