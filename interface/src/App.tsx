import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ChatModule from "./ChatModule";
import ExecutorChatModule from "./ExecutorChatModule";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [frameApis, setFrameApis] = useState<Record<string, string>>({
    frame1: "Grok",
    frame2: "NanoGPT",
    frame3: "Grok",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="grid grid-cols-3 h-screen gap-2 p-2">
          <ChatModule frameId="frame1" isTargeted={true} selectedApi={frameApis.frame1} />
          <ChatModule frameId="frame2" isTargeted={true} selectedApi={frameApis.frame2} />
          <ExecutorChatModule frameId="frame3" isTargeted={true} selectedApi={frameApis.frame3} />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
