// CodingModule.tsx
import React, { useState, useEffect } from "react";
import { Code, Send, Download, Save } from "lucide-react";
import BaseModule from "./BaseModule";
import { CodeSnippet } from "@/types/artTypes";
import { Button, ScrollArea, Input } from "@/components/ui";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

const SERVER_URL = "http://localhost:3000";

interface CodingModuleProps {
  frameId: string;
  isTargeted: boolean;
  codeSnippets: CodeSnippet[];
  chatRefs?: React.MutableRefObject<Record<string, { addMessage?: (msg: string) => void }>>;
}

const CodingModule = ({ frameId, isTargeted, codeSnippets: externalSnippets, chatRefs }: CodingModuleProps) => {
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>(externalSnippets);
  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    setCodeSnippets(externalSnippets);
  }, [externalSnippets]);

  const handleEditSnippet = (snippet: CodeSnippet) => {
    setCurrentSnippet(snippet);
    setEditContent(snippet.content);
    setIsEditing(true);
  };

  const handleSaveSnippet = () => {
    if (!currentSnippet) return;
    const updatedSnippet: CodeSnippet = {
      ...currentSnippet,
      content: editContent,
      timestamp: new Date(),
    };
    setCodeSnippets(prev => prev.map(s => (s.id === currentSnippet.id ? updatedSnippet : s)));
    setCurrentSnippet(updatedSnippet);
    setIsEditing(false);
  };

  const openSaveDialog = (snippet: CodeSnippet) => {
    setCurrentSnippet(snippet);
    // Generate a default filename based on language
    const extension = snippet.language === "javascript" ? "js" : 
                     (snippet.language === "python" ? "py" : 
                     (snippet.language === "html" ? "html" : snippet.language));
    setFileName(`${snippet.language}-${Date.now()}.${extension}`);
    setSaveDialogOpen(true);
  };

  const saveCodeToFile = async () => {
    if (!currentSnippet || !fileName) return;
    
    setSaveStatus("saving");
    try {
      const fullPath = `ART/sandbox/${fileName}`;
      const response = await fetch(`${SERVER_URL}/sandbox/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          path: fullPath, 
          content: currentSnippet.content 
        }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save file");
      
      setSaveStatus("success");
      // Notify chat if available
      if (chatRefs) {
        const chatFrame = Object.keys(chatRefs.current || {}).find(id => 
          id !== frameId && chatRefs.current[id]?.addMessage
        );
        if (chatFrame && chatRefs.current[chatFrame]?.addMessage) {
          chatRefs.current[chatFrame].addMessage(
            `Code from ${frameId} saved to ${fullPath}`
          );
        }
      }
      
      // Close dialog after short delay
      setTimeout(() => {
        setSaveDialogOpen(false);
        setSaveStatus("idle");
      }, 1500);
    } catch (error) {
      console.error("Error saving file:", error);
      setSaveStatus("error");
    }
  };

  const sendToChat = (snippet: CodeSnippet) => {
    const chatFrame = Object.keys(chatRefs?.current || {}).find(id => id !== frameId && chatRefs?.current[id]?.addMessage);
    if (chatFrame && chatRefs?.current[chatFrame]?.addMessage) {
      chatRefs.current[chatFrame].addMessage(`Code from ${frameId}:\n\`\`\`${snippet.language}\n${snippet.content}\n\`\`\``);
    }
  };

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Code" icon={<Code className="h-4 w-4" />}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          <ScrollArea className="h-full">
            {codeSnippets.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">No code snippets yet.</div>
            ) : (
              codeSnippets.map(snippet => (
                <div key={snippet.id} className="border border-muted rounded-md p-2 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold">
                      {snippet.title} ({snippet.language})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {snippet.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {isEditing && currentSnippet?.id === snippet.id ? (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full h-32 font-mono text-sm bg-background border border-input rounded-md p-2"
                    />
                  ) : (
                    <pre className="text-sm bg-secondary p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {snippet.content}
                    </pre>
                  )}
                  {isTargeted && (
                    <div className="flex space-x-2 mt-2">
                      {currentSnippet?.id === snippet.id && isEditing ? (
                        <Button size="sm" onClick={handleSaveSnippet} variant="outline">
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleEditSnippet(snippet)} variant="outline">
                          <Send className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                      <Button size="sm" onClick={() => openSaveDialog(snippet)} variant="outline">
                        <Download className="h-4 w-4 mr-1" /> Save As
                      </Button>
                      {chatRefs && (
                        <Button size="sm" onClick={() => sendToChat(snippet)} variant="outline">
                          <Send className="h-4 w-4 mr-1" /> Send to Chat
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
        {!isTargeted && (
          <div className="py-3 text-center text-sm text-muted-foreground border border-dashed rounded-md">
            Target this frame to edit snippets
          </div>
        )}
        
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Code to File</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="filename.extension"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                File will be saved to the ART sandbox directory
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveCodeToFile} 
                disabled={saveStatus === "saving"}
                className={saveStatus === "success" ? "bg-green-600" : ""}
              >
                {saveStatus === "idle" && "Save"}
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "success" && "Saved!"}
                {saveStatus === "error" && "Error - Try Again"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BaseModule>
  );
};

export default CodingModule;