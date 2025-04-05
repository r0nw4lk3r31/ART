const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

console.log('Starting Electron...');
const preloadPath = path.join(__dirname, 'preload.cjs');
console.log('Preload Path:', preloadPath);
if (!fs.existsSync(preloadPath)) console.error('Preload file missing!');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const viteUrl = 'http://localhost:5173'; // Fixed to Vite's port
  win.loadURL(viteUrl);

  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle frame-to-frame communication
ipcMain.on('frame-message', (event, message) => {
  console.log('Frame message received:', message);
  
  // Validate the message
  if (!message || !message.target || !message.sender || !message.message) {
    console.error('Invalid frame message format:', message);
    return;
  }
  
  // Prevent sending to self
  if (message.target === message.sender) {
    console.error(`Cannot send message to self: ${message.sender} -> ${message.target}`);
    return;
  }
  
  // Forward the message to the target frame
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    console.log(`Forwarding message from ${message.sender} to frame-${message.target}:`, message.message);
    windows[0].webContents.send(`frame-${message.target}`, message);
    console.log(`Message forwarded to frame-${message.target}`);
    
    // Also log to console for debugging
    event.sender.send('console-log', `Message from ${message.sender} to ${message.target}: ${message.message}`);
  } else {
    console.error('No windows available to forward message');
  }
});

ipcMain.handle('ping', () => {
  console.log('Ping received');
  return 'pong';
});

const agendaPath = path.join(__dirname, 'agenda.json');
ipcMain.handle('load-agenda', async () => {
  console.log('Loading agenda...');
  try {
    if (!fs.existsSync(agendaPath)) fs.writeFileSync(agendaPath, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  } catch (error) {
    console.error('Load agenda error:', error);
    return [];
  }
});

ipcMain.handle('save-agenda', async (event, events) => {
  console.log('Saving agenda...');
  try {
    fs.writeFileSync(agendaPath, JSON.stringify(events, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Save agenda error:', error);
    return { success: false, error: error.message };
  }
});

// Email functionality with Gmail
const emailsPath = path.join(__dirname, 'emails.json');
const EMAIL_USER = process.env.VITE_EMAIL_USER || 'mailto.artai@gmail.com';
const EMAIL_PASSCODE = process.env.VITE_EMAIL_PASSCODE || 'cwqffmqwwinartnd';
const RECIPIENT_EMAIL = process.env.VITE_RECIPIENT_EMAIL || 'recipient@example.com';

// Create a nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSCODE
  }
});

// Initialize emails.json if it doesn't exist
if (!fs.existsSync(emailsPath)) {
  fs.writeFileSync(emailsPath, JSON.stringify([], null, 2));
}

// Function to fetch emails from Gmail
async function fetchGmailEmails() {
  console.log('Fetching emails from Gmail...');
  
  try {
    // Create an IMAP connection
    const Imap = require('imap');
    const { simpleParser } = require('mailparser');
    
    const imapConfig = {
      user: EMAIL_USER,
      password: EMAIL_PASSCODE,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    console.log(`Connecting to Gmail with user: ${EMAIL_USER}`);
    
    return new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
      const emails = [];
      
      imap.once('ready', () => {
        console.log('IMAP connection ready');
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            reject(err);
            return;
          }
          
          console.log(`Mailbox opened with ${box.messages.total} messages`);
          
          // Search for all messages, not just unseen
          // This ensures we get emails even if they're already read
          imap.search(['ALL'], (err, results) => {
            if (err) {
              console.error('Search error:', err);
              reject(err);
              return;
            }
            
            if (!results || !results.length) {
              console.log('No emails found');
              resolve([]);
              imap.end();
              return;
            }
            
            console.log(`Found ${results.length} emails`);
            
            // Limit to the most recent 20 emails to avoid performance issues
            const recentResults = results.slice(-20);
            
            const f = imap.fetch(recentResults, { bodies: '' });
            let processedCount = 0;
            
            f.on('message', (msg, seqno) => {
              console.log(`Processing message #${seqno}`);
              
              msg.on('body', (stream) => {
                let buffer = '';
                
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                
                stream.once('end', () => {
                  simpleParser(buffer, (err, parsed) => {
                    if (err) {
                      console.error('Parser error:', err);
                      return;
                    }
                    
                    try {
                      const email = {
                        id: parsed.messageId || `gmail-${Date.now()}-${seqno}`,
                        subject: parsed.subject || '(No subject)',
                        sender: parsed.from ? parsed.from.text : 'unknown@example.com',
                        preview: parsed.text ? parsed.text.slice(0, 50) + (parsed.text.length > 50 ? '...' : '') : '',
                        body: parsed.text || parsed.textAsHtml || '',
                        date: parsed.date ? new Date(parsed.date).toLocaleString() : new Date().toLocaleString(),
                        read: true, // Mark as read since we're fetching all emails
                        folder: 'inbox'
                      };
                      
                      emails.push(email);
                      processedCount++;
                      
                      console.log(`Processed email: ${email.subject}`);
                      
                      // If all messages have been processed, resolve the promise
                      if (processedCount === recentResults.length) {
                        imap.end();
                        resolve(emails);
                      }
                    } catch (parseError) {
                      console.error('Error creating email object:', parseError);
                    }
                  });
                });
              });
            });
            
            f.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });
            
            f.once('end', () => {
              console.log('Fetch completed');
              // Only end the connection if no emails were processed
              // Otherwise, it will be ended after processing all emails
              if (emails.length === 0) {
                imap.end();
                resolve(emails);
              }
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });
      
      imap.once('end', () => {
        console.log('IMAP connection ended');
      });
      
      // Set a timeout to avoid hanging connections
      const timeout = setTimeout(() => {
        console.log('IMAP connection timeout');
        try {
          imap.end();
        } catch (e) {
          console.error('Error ending IMAP connection:', e);
        }
        resolve([]); // Resolve with empty array on timeout
      }, 30000); // 30 second timeout
      
      imap.connect();
      console.log('IMAP connect called');
      
      // Clear the timeout when the connection ends
      imap.once('end', () => {
        clearTimeout(timeout);
      });
    });
  } catch (error) {
    console.error('Error in fetchGmailEmails:', error);
    return [];
  }
}

ipcMain.handle('fetch-emails', async () => {
  console.log('Fetching emails...');
  try {
    // Try to fetch emails from Gmail
    let gmailEmails = [];
    try {
      console.log('Attempting to fetch Gmail emails...');
      gmailEmails = await fetchGmailEmails();
      console.log(`Successfully fetched ${gmailEmails.length} emails from Gmail`);
      
      // If we got emails from Gmail, return them immediately
      if (gmailEmails.length > 0) {
        // Also load locally stored emails
        let localEmails = [];
        if (fs.existsSync(emailsPath)) {
          localEmails = JSON.parse(fs.readFileSync(emailsPath, 'utf-8'));
        }
        
        // Combine Gmail and local emails, avoiding duplicates by ID
        const emailMap = new Map();
        [...gmailEmails, ...localEmails].forEach(email => {
          emailMap.set(email.id, email);
        });
        
        const allEmails = Array.from(emailMap.values());
        
        // Save the updated email list back to the file
        fs.writeFileSync(emailsPath, JSON.stringify(allEmails, null, 2));
        
        return { success: true, emails: allEmails };
      }
    } catch (gmailError) {
      console.error('Error fetching from Gmail:', gmailError);
    }
    
    console.log('Falling back to local emails or mock data');
    
    // If Gmail fetch failed or returned no emails, try local emails
    let localEmails = [];
    if (fs.existsSync(emailsPath)) {
      try {
        localEmails = JSON.parse(fs.readFileSync(emailsPath, 'utf-8'));
        console.log(`Loaded ${localEmails.length} local emails`);
        
        if (localEmails.length > 0) {
          return { success: true, emails: localEmails };
        }
      } catch (localError) {
        console.error('Error reading local emails:', localError);
      }
    }
    
    // If we have no emails at all, use mock data
    console.log('No emails found, using mock data');
    const mockEmails = [
      {
        id: '1',
        subject: 'Welcome to ART Interface',
        sender: 'system@art-interface.com',
        preview: 'Welcome to the ART Interface email system!',
        body: 'Welcome to the ART Interface email system! This is a sample email to get you started. You can reply to this email or compose new ones using the interface.',
        date: new Date().toLocaleString(),
        read: false,
        folder: 'inbox'
      },
      {
        id: '2',
        subject: 'Getting Started with Email Module',
        sender: 'support@art-interface.com',
        preview: 'Here are some tips to get started with the Email Module...',
        body: 'Here are some tips to get started with the Email Module:\n\n1. Click the compose button to create a new email\n2. Use the folder buttons to switch between inbox, sent, and drafts\n3. Click on an email to view its contents\n4. Reply to emails or delete them as needed\n\nEnjoy using the ART Interface!',
        date: new Date(Date.now() - 3600000).toLocaleString(),
        read: false,
        folder: 'inbox'
      },
      {
        id: '3',
        subject: 'Your Google Account',
        sender: 'no-reply@google.com',
        preview: 'Important information about your Google Account...',
        body: 'Your Google Account gives you access to many Google services. We wanted to remind you about some important security features to keep your account safe.\n\n1. Use a strong, unique password\n2. Enable two-factor authentication\n3. Regularly review account activity\n\nStay safe online!',
        date: new Date(Date.now() - 7200000).toLocaleString(),
        read: false,
        folder: 'inbox'
      },
      {
        id: '4',
        subject: 'ART Interface Updates',
        sender: 'updates@art-interface.com',
        preview: 'New features coming to your ART Interface...',
        body: 'We\'re excited to announce new features coming to your ART Interface:\n\n- Improved email integration with Gmail\n- Enhanced calendar functionality\n- New productivity tools\n- Better performance and reliability\n\nStay tuned for these updates in the coming weeks!',
        date: new Date(Date.now() - 10800000).toLocaleString(),
        read: false,
        folder: 'inbox'
      }
    ];
    
    // Save mock emails to the local file
    fs.writeFileSync(emailsPath, JSON.stringify(mockEmails, null, 2));
    
    return { success: true, emails: mockEmails };
  } catch (error) {
    console.error('Fetch emails error:', error);
    
    // Fallback to mock data if everything fails
    const mockEmails = [
      {
        id: '1',
        subject: 'Welcome to ART Interface',
        sender: 'system@art-interface.com',
        preview: 'Welcome to the ART Interface email system!',
        body: 'Welcome to the ART Interface email system! This is a sample email to get you started. You can reply to this email or compose new ones using the interface.',
        date: new Date().toLocaleString(),
        read: false,
        folder: 'inbox'
      },
      {
        id: '2',
        subject: 'Getting Started with Email Module',
        sender: 'support@art-interface.com',
        preview: 'Here are some tips to get started with the Email Module...',
        body: 'Here are some tips to get started with the Email Module:\n\n1. Click the compose button to create a new email\n2. Use the folder buttons to switch between inbox, sent, and drafts\n3. Click on an email to view its contents\n4. Reply to emails or delete them as needed\n\nEnjoy using the ART Interface!',
        date: new Date(Date.now() - 3600000).toLocaleString(),
        read: false,
        folder: 'inbox'
      }
    ];
    
    return { success: false, error: error.message, emails: mockEmails };
  }
});

ipcMain.handle('send-email', async (event, { to, subject, body }) => {
  console.log('Sending email to:', to);
  try {
    // Validate inputs
    if (!to || !subject || !body) {
      console.error('Missing required email fields');
      return { success: false, error: 'Missing required email fields' };
    }
    
    // Send email using nodemailer
    const mailOptions = {
      from: EMAIL_USER,
      to: to || RECIPIENT_EMAIL,
      subject: subject,
      text: body
    };
    
    console.log(`Attempting to send email from ${EMAIL_USER} to ${to}`);
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.response);
      
      // Save to local sent folder
      const emails = fs.existsSync(emailsPath) 
        ? JSON.parse(fs.readFileSync(emailsPath, 'utf-8')) 
        : [];
      
      const newEmail = {
        id: `sent-${Date.now()}`,
        subject,
        sender: EMAIL_USER,
        preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''),
        body,
        date: new Date().toLocaleString(),
        read: true,
        folder: 'sent'
      };
      
      emails.push(newEmail);
      fs.writeFileSync(emailsPath, JSON.stringify(emails, null, 2));
      
      return { success: true, messageId: info.messageId };
    } catch (sendError) {
      console.error('Error sending email via nodemailer:', sendError);
      
      // If sending fails, still save to local sent folder but mark as failed
      const emails = fs.existsSync(emailsPath) 
        ? JSON.parse(fs.readFileSync(emailsPath, 'utf-8')) 
        : [];
      
      const newEmail = {
        id: `failed-${Date.now()}`,
        subject: `${subject} (FAILED TO SEND)`,
        sender: EMAIL_USER,
        preview: body.slice(0, 50) + (body.length > 50 ? '...' : ''),
        body: `${body}\n\n[FAILED TO SEND: ${sendError.message}]`,
        date: new Date().toLocaleString(),
        read: true,
        folder: 'sent'
      };
      
      emails.push(newEmail);
      fs.writeFileSync(emailsPath, JSON.stringify(emails, null, 2));
      
      return { success: false, error: sendError.message };
    }
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: error.message };
  }
});
