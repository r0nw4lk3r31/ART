
import React from 'react';
import { BarChart } from 'lucide-react';
import BaseModule from './BaseModule';

interface StatsModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const StatsModule = ({ frameId, isTargeted }: StatsModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Statistics"
      icon={<BarChart className="h-4 w-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <BarChart className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Statistics Module</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Monitor system statistics and analytics for your ART ecosystem.
        </p>
        <p className="text-xs text-muted-foreground">
          Connect more modules to see detailed statistics.
        </p>
      </div>
    </BaseModule>
  );
};

export default StatsModule;
