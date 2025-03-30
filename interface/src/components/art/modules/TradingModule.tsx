
import React from 'react';
import { LineChart, TrendingUp } from 'lucide-react';
import BaseModule from './BaseModule';

interface TradingModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const TradingModule = ({ frameId, isTargeted }: TradingModuleProps) => {
  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Trading"
      icon={<TrendingUp className="h-4 w-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <LineChart className="h-16 w-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Trading Module</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect with Bitvavo API to monitor and trade cryptocurrency.
        </p>
        <p className="text-xs text-muted-foreground">
          To activate, please enter your API credentials in the command line.
        </p>
      </div>
    </BaseModule>
  );
};

export default TradingModule;
