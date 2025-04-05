import React, { useState, useEffect } from 'react';
import { CodeSnippet } from '@/types/artTypes';
import BaseModule from './BaseModule';
import { Button, ScrollArea, Textarea } from '@/components/ui';
import { Code, FileCode, Save, Edit, Copy, Trash, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodingModuleProps {
  frameId: string;
  isTargeted: boolean;
  codeSnippets?: CodeSnippet[];
  onSendToChat?: (content: string) => void; // New prop to send code to chat
}

const CodingModule = ({ frameId, isTargeted, codeSnippets: externalSnippets = [], onSendToChat }: CodingModuleProps) => {
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>(externalSnippets);
  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const { toast } = useToast();

  // Sync with external snippets from ArtDashboard
  useEffect(() => {
    setCodeSnippets(externalSnippets);
  }, [externalSnippets]);

  const handleCreateNewSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      content: '',
      language: 'javascript',
      title: 'New Snippet',
      timestamp: new Date(),
    };
    setCodeSnippets(prev => [newSnippet, ...prev]);
    setCurrentSnippet(newSnippet);
    setIsEditing(true);
    setEditContent('');
    setEditTitle('New Snippet');
    toast({ title: 'New Snippet Created', description: 'Start coding!' });
  };

  const handleEditSnippet = (snippet: CodeSnippet) => {
    setCurrentSnippet(snippet);
    setEditContent(snippet.content);
    setEditTitle(snippet.title);
    setIsEditing(true);
  };

  const handleSaveSnippet = () => {
    if (!currentSnippet) return;
    const updatedSnippet: CodeSnippet = {
      ...currentSnippet,
      content: editContent,
      title: editTitle,
      timestamp: new Date(),
    };
    setCodeSnippets(prev =>
      prev.map(s => (s.id === currentSnippet.id ? updatedSnippet : s))
    );
    setCurrentSnippet(updatedSnippet);
    setIsEditing(false);
    toast({ title: 'Snippet Saved', description: `"${editTitle}" saved` });
  };

  const handleDeleteSnippet = (id: string) => {
    setCodeSnippets(prev => prev.filter(s => s.id !== id));
    if (currentSnippet?.id === id) {
      setCurrentSnippet(null);
      setIsEditing(false);
    }
    toast({ title: 'Snippet Deleted', description: 'Snippet removed' });
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: 'Copied', description: 'Code copied to clipboard' });
    });
  };

  const handleSendToChat = () => {
    if (!currentSnippet || !onSendToChat) return;
    onSendToChat(currentSnippet.content);
    toast({ title: 'Sent to Chat', description: `"${currentSnippet.title}" sent to Chat module` });
  };

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Coding" icon={<Code className="h-4 w-4" />}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between mb-3">
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleCreateNewSnippet} variant="outline">
              <FileCode className="h-4 w-4 mr-1" /> New
            </Button>
            {currentSnippet && (
              <>
                {isEditing ? (
                  <Button size="sm" onClick={handleSaveSnippet} variant="outline">
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleEditSnippet(currentSnippet)} variant="outline">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
                <Button size="sm" onClick={() => handleCopyToClipboard(currentSnippet.content)} variant="outline">
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button size="sm" onClick={handleSendToChat} variant="outline">
                  <MessageSquare className="h-4 w-4 mr-1" /> Send to Chat
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDeleteSnippet(currentSnippet.id)}
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1">
          <div className="col-span-1 bg-muted rounded-md p-2 overflow-hidden">
            <h3 className="font-medium text-sm mb-2">Snippets</h3>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2">
                {codeSnippets.length > 0 ? (
                  codeSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className={`p-2 rounded-md cursor-pointer hover:bg-accent text-sm ${
                        currentSnippet?.id === snippet.id ? 'bg-accent' : 'bg-background'
                      }`}
                      onClick={() => {
                        setCurrentSnippet(snippet);
                        setIsEditing(false);
                      }}
                    >
                      <div className="font-medium truncate">{snippet.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {snippet.language} • {snippet.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-2">No snippets yet</div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-3 bg-muted rounded-md p-2 overflow-hidden flex flex-col">
            {currentSnippet ? (
              <>
                <div className="mb-2 flex justify-between items-center">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-background border border-input px-2 py-1 rounded-md text-sm flex-1 mr-2"
                    />
                  ) : (
                    <h3 className="font-medium text-sm">{currentSnippet.title}</h3>
                  )}
                  <span className="text-xs text-muted-foreground">{currentSnippet.language}</span>
                </div>
                <ScrollArea className="flex-1">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm bg-background"
                    />
                  ) : (
                    <SyntaxHighlighter
                      language={currentSnippet.language}
                      style={vscDarkPlus}
                      className="text-sm font-mono rounded-md"
                      customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                    >
                      {currentSnippet.content}
                    </SyntaxHighlighter>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a snippet or create a new one
              </div>
            )}
          </div>
        </div>
        {!isTargeted && (
          <div className="py-3 mt-3 text-center text-sm text-muted-foreground border border-dashed rounded-md">
            Target this frame to use console commands
          </div>
        )}
      </div>
    </BaseModule>
  );
};

export default CodingModule;