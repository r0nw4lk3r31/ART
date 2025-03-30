
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
    <div className="p-4 h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-2">
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
        <CardContent className="px-0 pb-0 flex-1 overflow-auto">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseModule;
