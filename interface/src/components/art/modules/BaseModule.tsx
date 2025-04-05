import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BaseModuleProps {
  frameId: string;
  isTargeted: boolean;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BaseModule = ({ frameId, isTargeted, title, icon, children }: BaseModuleProps) => {
  return (
    <div className="h-full w-full flex flex-col p-0"> {/* Remove padding, add w-full */}
      <Card className="flex-1 flex flex-col overflow-hidden border-none bg-transparent w-full !max-w-none">
        <CardHeader className="px-4 pt-2 pb-2"> {/* Move padding here */}
          <CardTitle className="text-md font-medium flex items-center gap-2">
            {icon}
            {title}
            {isTargeted && (
              <span className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full">
                Active
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex-1 overflow-auto"> {/* Move padding here */}
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseModule;