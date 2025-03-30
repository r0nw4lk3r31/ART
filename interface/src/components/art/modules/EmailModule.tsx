
import React, { useState } from 'react';
import { MailOpen, Inbox, Send as SendIcon, Edit, Trash, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseModule from './BaseModule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
}

interface EmailModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const EmailModule = ({ frameId, isTargeted }: EmailModuleProps) => {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<Email[]>([
    {
      id: '1',
      subject: 'Meeting Tomorrow',
      sender: 'John Doe <john@example.com>',
      preview: 'Hello, I wanted to confirm our meeting tomorrow at 2pm...',
      date: '10:30 AM',
      read: false,
      folder: 'inbox'
    },
    {
      id: '2',
      subject: 'Project Update',
      sender: 'Sarah Smith <sarah@example.com>',
      preview: "I've finished the first phase of the project and wanted to share...",
      date: 'Yesterday',
      read: true,
      folder: 'inbox'
    },
    {
      id: '3',
      subject: 'Invoice #1234',
      sender: 'Billing <billing@example.com>',
      preview: 'Your invoice for November services is attached...',
      date: 'Nov 28',
      read: true,
      folder: 'inbox'
    },
    {
      id: '4',
      subject: 'Re: Question about API',
      sender: 'Tech Support <support@example.com>',
      preview: 'To answer your question about the API limits...',
      date: 'Nov 26',
      read: true,
      folder: 'inbox'
    },
    {
      id: '5',
      subject: 'Draft: Project Proposal',
      sender: 'Me',
      preview: 'Here is my proposal for the new project...',
      date: '2:45 PM',
      read: true,
      folder: 'drafts'
    }
  ]);

  const filteredEmails = emails.filter(email => 
    email.folder === activeFolder && 
    (searchQuery === '' || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMarkAsRead = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, read: true } : email
    ));
  };

  const handleFolderChange = (folder: 'inbox' | 'sent' | 'drafts' | 'trash') => {
    setActiveFolder(folder);
  };

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Email"
      icon={<MailOpen className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex mb-4 space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search emails..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            value={activeFolder} 
            onValueChange={(value) => handleFolderChange(value as any)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbox">
                <div className="flex items-center">
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                </div>
              </SelectItem>
              <SelectItem value="sent">
                <div className="flex items-center">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Sent
                </div>
              </SelectItem>
              <SelectItem value="drafts">
                <div className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Drafts
                </div>
              </SelectItem>
              <SelectItem value="trash">
                <div className="flex items-center">
                  <Trash className="mr-2 h-4 w-4" />
                  Trash
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No emails found
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                className={`p-3 rounded-md cursor-pointer ${
                  email.read ? 'bg-muted/40' : 'bg-muted'
                } hover:bg-muted/60 transition-colors`}
                onClick={() => handleMarkAsRead(email.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">
                    {!email.read && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2"></span>}
                    {email.subject}
                  </div>
                  <div className="text-xs text-muted-foreground">{email.date}</div>
                </div>
                <div className="text-xs mt-1 text-muted-foreground">{email.sender}</div>
                <div className="text-xs mt-1 truncate">{email.preview}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <Button className="w-full">
            <Edit className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>
    </BaseModule>
  );
};

export default EmailModule;
