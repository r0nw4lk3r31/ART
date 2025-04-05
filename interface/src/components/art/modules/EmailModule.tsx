import React, { useState, useEffect } from 'react';
import { 
  MailOpen, 
  Inbox, 
  Send as SendIcon, 
  Edit, 
  Search, 
  Trash2, 
  ArrowLeft, 
  Mail, 
  RefreshCw, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BaseModule from './BaseModule';
import { toast } from 'sonner';

interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts';
  body?: string;
  important?: boolean;
  attachments?: { name: string; size: string }[];
  failed?: boolean;
}

interface EmailModuleProps {
  frameId: string;
  isTargeted: boolean;
}

// Add window.electronAPI interface
declare global {
  interface Window {
    electronAPI?: {
      ping: () => Promise<string>;
      fetchEmails: () => Promise<{ success: boolean; emails?: Email[]; error?: string }>;
      sendEmail: (to: string, subject: string, body: string) => Promise<{ success: boolean; error?: string }>;
      loadAgenda: () => Promise<unknown[]>;
      saveAgenda: (events: unknown[]) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const EmailModule = ({ frameId, isTargeted }: EmailModuleProps) => {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [to, setTo] = useState(import.meta.env.VITE_RECIPIENT_EMAIL || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const fetchEmails = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        setConnectionStatus('connecting');
        const result = await window.electronAPI.fetchEmails();
        if (result.success) {
          setEmails(result.emails || []);
          setConnectionStatus('connected');
          toast.success('Emails loaded successfully');
        } else {
          setConnectionStatus('disconnected');
          toast.error('Failed to fetch emails: ' + result.error);
          // Fallback to mock data if API fails
          loadMockEmails();
        }
      } else {
        // Browser mode - use mock data
        setConnectionStatus('disconnected');
        loadMockEmails();
        toast.info('Running in browser mode - Using mock emails');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setConnectionStatus('disconnected');
      toast.error('Error fetching emails: ' + (error as Error).message);
      // Fallback to mock data on error
      loadMockEmails();
    } finally {
      setLoading(false);
    }
  };

  const loadMockEmails = () => {
    const mockEmails: Email[] = [
      { 
        id: '1', 
        subject: 'Welcome to Gmail Integration', 
        sender: 'ART System <system@art-interface.com>', 
        preview: 'Welcome to the Gmail integration in ART Interface!', 
        body: 'Welcome to the Gmail integration in ART Interface!\n\nThis email client allows you to:\n- Read your Gmail messages\n- Send new emails\n- Reply to existing conversations\n- Organize your inbox\n\nEnjoy using the ART Email Module!', 
        date: new Date().toLocaleString(), 
        read: false, 
        folder: 'inbox',
        important: true
      },
      { 
        id: '2', 
        subject: 'Your Google Account Security', 
        sender: 'Google <no-reply@google.com>', 
        preview: 'Important information about your Google Account security...', 
        body: 'Your Google Account gives you access to many Google services. We wanted to remind you about some important security features to keep your account safe.\n\n1. Use a strong, unique password\n2. Enable two-factor authentication\n3. Regularly review account activity\n\nStay safe online!', 
        date: new Date(Date.now() - 3600000).toLocaleString(), 
        read: true, 
        folder: 'inbox',
        important: true
      },
      { 
        id: '3', 
        subject: 'Weekly Newsletter', 
        sender: 'News <newsletter@example.com>', 
        preview: 'Check out the latest updates and news in tech...', 
        body: 'This Week in Tech:\n\n- AI advancements continue to reshape industries\n- New smartphone releases from major manufacturers\n- Cybersecurity concerns grow as attacks increase\n- Open source projects gaining momentum\n\nRead more on our website!', 
        date: new Date(Date.now() - 7200000).toLocaleString(), 
        read: false, 
        folder: 'inbox'
      },
      { 
        id: '4', 
        subject: 'Meeting Reminder', 
        sender: 'Calendar <calendar@example.com>', 
        preview: 'Reminder: Team meeting tomorrow at 10:00 AM...', 
        body: 'This is a reminder about your upcoming meeting:\n\nTeam Weekly Sync\nDate: Tomorrow\nTime: 10:00 AM - 11:00 AM\nLocation: Conference Room A or Zoom\n\nPlease prepare your weekly updates and be ready to discuss current project status.', 
        date: new Date(Date.now() - 10800000).toLocaleString(), 
        read: true, 
        folder: 'inbox'
      },
      { 
        id: '5', 
        subject: 'Project Update', 
        sender: 'Project Manager <pm@company.com>', 
        preview: 'Here\'s the latest update on our current project...', 
        body: 'Project Status Update:\n\nWe\'re currently at 75% completion of Phase 2. The development team has made significant progress on the backend systems, and the frontend is starting to take shape.\n\nNext steps:\n1. Complete API integration\n2. Finalize UI components\n3. Begin testing phase\n\nPlease review the attached documents for more details.', 
        date: new Date(Date.now() - 14400000).toLocaleString(), 
        read: false, 
        folder: 'inbox',
        attachments: [
          { name: 'project_update.pdf', size: '2.4 MB' },
          { name: 'timeline.xlsx', size: '1.1 MB' }
        ]
      },
      { 
        id: '6', 
        subject: 'Re: Question about ART Interface', 
        sender: 'Support <support@art-interface.com>', 
        preview: 'Thanks for your question about the ART Interface...', 
        body: 'Thanks for your question about the ART Interface!\n\nThe Email Module is designed to integrate with Gmail and provide a seamless experience for managing your emails within the ART environment.\n\nIf you have any more questions, feel free to reply to this email.', 
        date: new Date(Date.now() - 86400000).toLocaleString(), 
        read: true, 
        folder: 'inbox'
      },
      { 
        id: '7', 
        subject: 'Question about Email Module', 
        sender: 'Me <user@example.com>', 
        preview: 'I was wondering how the Email Module works with Gmail...', 
        body: 'I was wondering how the Email Module works with Gmail. Can you provide some details about the integration?\n\nThanks!', 
        date: new Date(Date.now() - 172800000).toLocaleString(), 
        read: true, 
        folder: 'sent'
      },
      { 
        id: '8', 
        subject: 'Meeting Notes', 
        sender: 'Me <user@example.com>', 
        preview: 'Here are the notes from our meeting today...', 
        body: 'Here are the notes from our meeting today:\n\n- Discussed project timeline\n- Assigned tasks to team members\n- Set next meeting for Friday\n- Reviewed budget constraints\n\nLet me know if you have any questions!', 
        date: new Date(Date.now() - 259200000).toLocaleString(), 
        read: true, 
        folder: 'sent',
        attachments: [
          { name: 'meeting_notes.docx', size: '1.2 MB' }
        ]
      },
      { 
        id: '9', 
        subject: 'Draft: Ideas for next project', 
        sender: 'Me <user@example.com>', 
        preview: 'Here are some ideas I\'ve been thinking about for our next project...', 
        body: 'Here are some ideas I\'ve been thinking about for our next project:\n\n1. Mobile app integration\n2. Enhanced analytics dashboard\n3. User customization options\n4. Performance optimizations\n\nNeed to flesh these out more before sharing with the team.', 
        date: new Date(Date.now() - 345600000).toLocaleString(), 
        read: true, 
        folder: 'drafts'
      }
    ];
    
    setEmails(mockEmails);
  };

  useEffect(() => {
    const testIPC = async () => {
      try {
        if (window.electronAPI) {
          const pong = await window.electronAPI.ping();
          console.log('IPC Test:', pong);
          if (pong === 'pong') {
            setConnectionStatus('connected');
            toast.success('Connected to Electron');
          } else {
            setConnectionStatus('disconnected');
            toast.error('Unexpected IPC response');
          }
        } else {
          console.log('Browser mode - Mock IPC');
          setConnectionStatus('disconnected');
          toast.info('Running in browser - Mock mode');
        }
      } catch (error) {
        console.error('IPC error:', error);
        setConnectionStatus('disconnected');
        toast.error('IPC not working: ' + (error as Error).message);
      }
    };
    testIPC();
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter(
    (email) =>
      email.folder === activeFolder &&
      (searchQuery === '' || email.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sendEmail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSendingEmail(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.sendEmail(to, subject, body);
        if (result.success) {
          setEmails((prev) => [
            ...prev,
            { 
              id: `sent-${Date.now()}`, 
              subject, 
              sender: 'Me <user@example.com>', 
              preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''), 
              body, 
              date: new Date().toLocaleString(), 
              read: true, 
              folder: 'sent' 
            },
          ]);
          setTo(import.meta.env.VITE_RECIPIENT_EMAIL || '');
          setSubject('');
          setBody('');
          setIsComposing(false);
          setIsReplying(false);
          setSelectedEmail(null);
          toast.success('Email sent successfully!');
        } else {
          // Add to sent folder but mark as failed
          setEmails((prev) => [
            ...prev,
            { 
              id: `failed-${Date.now()}`, 
              subject: `${subject} (FAILED TO SEND)`, 
              sender: 'Me <user@example.com>', 
              preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''), 
              body: `${body}\n\n[FAILED TO SEND: ${result.error}]`, 
              date: new Date().toLocaleString(), 
              read: true, 
              folder: 'sent',
              failed: true
            },
          ]);
          toast.error('Failed to send email: ' + result.error);
        }
      } else {
        // Browser mode - simulate sending
        setEmails((prev) => [
          ...prev,
          { 
            id: `sent-${Date.now()}`, 
            subject, 
            sender: 'Me <user@example.com>', 
            preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''), 
            body, 
            date: new Date().toLocaleString(), 
            read: true, 
            folder: 'sent' 
          },
        ]);
        setTo(import.meta.env.VITE_RECIPIENT_EMAIL || '');
        setSubject('');
        setBody('');
        setIsComposing(false);
        setIsReplying(false);
        setSelectedEmail(null);
        toast.success('Email sent! (Browser mock mode)');
      }
    } catch (error) {
      toast.error('Error sending email: ' + (error as Error).message);
      // Add to sent folder but mark as failed
      setEmails((prev) => [
        ...prev,
        { 
          id: `failed-${Date.now()}`, 
          subject: `${subject} (FAILED TO SEND)`, 
          sender: 'Me <user@example.com>', 
          preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''), 
          body: `${body}\n\n[FAILED TO SEND: ${(error as Error).message}]`, 
          date: new Date().toLocaleString(), 
          read: true, 
          folder: 'sent',
          failed: true
        },
      ]);
    } finally {
      setSendingEmail(false);
    }
  };

  const deleteEmail = (id: string) => {
    setEmails((prev) => prev.filter((email) => email.id !== id));
    setSelectedEmail(null);
    toast.success('Email deleted');
    
    if (window.electronAPI) {
      // In a real implementation, we would call an IPC method to delete the email
      toast.info('Note: Email deleted locally only');
    }
  };

  const toggleReadStatus = (id: string) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, read: !email.read } : email
      )
    );
    if (selectedEmail?.id === id) {
      setSelectedEmail((prev) => (prev ? { ...prev, read: !prev.read } : null));
    }
    
    const email = emails.find(e => e.id === id);
    const newStatus = email?.read ? 'unread' : 'read';
    toast.success(`Marked as ${newStatus}`);
  };

  const startReply = () => {
    if (selectedEmail) {
      // Extract email from sender format like "Name <email@example.com>"
      const emailMatch = selectedEmail.sender.match(/<([^>]+)>/) || [null, selectedEmail.sender];
      const senderEmail = emailMatch[1];
      
      setTo(senderEmail);
      setSubject(`Re: ${selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject.substring(4).trim() : selectedEmail.subject}`);
      
      // Format the reply with proper quoting
      const quoteLines = (selectedEmail.body || selectedEmail.preview).split('\n').map(line => `> ${line}`).join('\n');
      setBody(`\n\nOn ${selectedEmail.date}, ${selectedEmail.sender} wrote:\n${quoteLines}`);
      
      setIsReplying(true);
      setIsComposing(true);
    }
  };
  
  const saveDraft = () => {
    if (!subject.trim() && !body.trim()) {
      toast.error('Cannot save empty draft');
      return;
    }
    
    const newDraft: Email = {
      id: `draft-${Date.now()}`,
      subject: subject || '(No subject)',
      sender: 'Me <user@example.com>',
      preview: body.slice(0, 50) + (body.length > 50 ? '...' : '') || '(No content)',
      body,
      date: new Date().toLocaleString(),
      read: true,
      folder: 'drafts'
    };
    
    setEmails(prev => [...prev, newDraft]);
    setIsComposing(false);
    setIsReplying(false);
    setSelectedEmail(null);
    setTo('');
    setSubject('');
    setBody('');
    
    toast.success('Draft saved');
  };
  
  const getUnreadCount = (folder: 'inbox' | 'sent' | 'drafts') => {
    return emails.filter(email => email.folder === folder && !email.read).length;
  };

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Email" icon={<MailOpen className="h-4 w-4" />}>
      <div className="h-full flex flex-col bg-gray-900 text-gray-200">
        {/* Status indicator */}
        <div className="px-2 py-1 bg-gray-800 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center">
            <span className="text-xs mr-2">Status:</span>
            {connectionStatus === 'connected' ? (
              <span className="flex items-center text-xs text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected to Gmail
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="flex items-center text-xs text-yellow-400">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Connecting...
              </span>
            ) : (
              <span className="flex items-center text-xs text-red-400">
                <AlertCircle className="h-3 w-3 mr-1" /> Using mock data
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {activeFolder === 'inbox' && getUnreadCount('inbox') > 0 && (
              <span>{getUnreadCount('inbox')} unread</span>
            )}
          </div>
        </div>
        
        {(isComposing || selectedEmail) ? (
          <div className="flex-1 p-4 flex flex-col bg-gray-800">
            {isComposing ? (
              <>
                <div className="flex items-center mb-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setIsComposing(false); setIsReplying(false); setSelectedEmail(null); }} 
                    className="text-gray-200 hover:bg-gray-700 mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-semibold">{isReplying ? 'Reply' : 'New Email'}</h2>
                </div>
                
                <Input
                  placeholder="To"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mb-2 bg-gray-700 text-gray-200 border-gray-600"
                />
                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mb-2 bg-gray-700 text-gray-200 border-gray-600"
                />
                <Textarea
                  placeholder="Type your email here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="flex-1 mb-2 bg-gray-700 text-gray-200 border-gray-600 min-h-[200px]"
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={sendEmail} 
                    disabled={sendingEmail} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={saveDraft} 
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setIsComposing(false); setIsReplying(false); setSelectedEmail(null); }} 
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : selectedEmail ? (
              <>
                <div className="flex items-center mb-2 bg-gray-700 p-2 rounded">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)} className="text-gray-200 hover:bg-gray-600">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-semibold flex-1">
                    {selectedEmail.subject}
                    {selectedEmail.important && (
                      <Badge className="ml-2 bg-yellow-600 text-white">Important</Badge>
                    )}
                    {selectedEmail.failed && (
                      <Badge className="ml-2 bg-red-600 text-white">Failed</Badge>
                    )}
                  </h2>
                </div>
                <div className="bg-gray-700 p-3 rounded mb-3">
                  <p className="text-sm text-gray-300">From: {selectedEmail.sender}</p>
                  <p className="text-sm text-gray-300">Date: {selectedEmail.date}</p>
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">Attachments:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmail.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center bg-gray-600 px-2 py-1 rounded text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {attachment.name} ({attachment.size})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Separator className="my-2 bg-gray-600" />
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-gray-200 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-2">
                  {selectedEmail.body || selectedEmail.preview}
                </div>
                <Separator className="my-2 bg-gray-600" />
                <div className="flex space-x-2 mt-2">
                  <Button onClick={startReply} className="bg-blue-600 hover:bg-blue-700">
                    <SendIcon className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" onClick={() => deleteEmail(selectedEmail.id)} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button variant="outline" onClick={() => toggleReadStatus(selectedEmail.id)} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                    <Mail className="h-4 w-4 mr-2" /> 
                    {selectedEmail.read ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-center p-2 bg-gray-700">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposing(true)} 
                className="text-gray-200 hover:bg-gray-600"
                title="Compose"
              >
                <Edit className="h-5 w-5" />
              </Button>
              
              <Button 
                variant={activeFolder === 'inbox' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setActiveFolder('inbox')} 
                className="text-gray-200 hover:bg-gray-600 relative"
                title="Inbox"
              >
                <Inbox className="h-5 w-5" />
                {getUnreadCount('inbox') > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {getUnreadCount('inbox')}
                  </span>
                )}
              </Button>
              
              <Button 
                variant={activeFolder === 'sent' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setActiveFolder('sent')} 
                className="text-gray-200 hover:bg-gray-600"
                title="Sent"
              >
                <SendIcon className="h-5 w-5" />
              </Button>
              
              <Button 
                variant={activeFolder === 'drafts' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setActiveFolder('drafts')} 
                className="text-gray-200 hover:bg-gray-600 relative"
                title="Drafts"
              >
                <FileText className="h-5 w-5" />
                {getUnreadCount('drafts') > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {getUnreadCount('drafts')}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchEmails} 
                disabled={loading}
                className="text-gray-200 hover:bg-gray-600"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <div className="relative flex-1 ml-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-400">Loading emails...</span>
                </div>
              ) : filteredEmails.length > 0 ? (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                      email.read ? 'text-gray-400' : 'text-gray-200 font-semibold'
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate max-w-[70%]">{email.sender}</span>
                      <span className="text-xs text-gray-500">{email.date}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="truncate flex-1">
                        {email.subject}
                        {email.important && (
                          <span className="ml-2 text-yellow-500">⚠</span>
                        )}
                        {email.failed && (
                          <span className="ml-2 text-red-500">⚠</span>
                        )}
                      </span>
                      {email.attachments && email.attachments.length > 0 && (
                        <FileText className="h-4 w-4 text-gray-500 ml-1" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{email.preview}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">No emails found</div>
              )}
            </div>
          </>
        )}
      </div>
    </BaseModule>
  );
};

export default EmailModule;
