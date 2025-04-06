const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

console.log('Starting server...');
console.log('CORS module:', typeof cors);

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.path}`);
  res.on('finish', () => {
    console.log(`Response: ${res.statusCode}`);
  });
  next();
});

const SANDBOX_DIR = path.join(__dirname, 'sandbox/ART/sandbox');

fs.mkdir(SANDBOX_DIR, { recursive: true }).catch(err => console.error('Failed to create sandbox:', err));

app.post('/sandbox/mkdir', async (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'Path is required' });
  try {
    const fullPath = path.join(SANDBOX_DIR, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sandbox/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });
  try {
    const fullPath = path.join(SANDBOX_DIR, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content || '', 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sandbox/read', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });
  try {
    const fullPath = path.join(SANDBOX_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sandbox/list', async (req, res) => {
  console.log('Handling /sandbox/list');
  const { recursive } = req.query;
  try {
    let files;
    if (recursive === 'true') {
      // Implement recursive listing
      files = await listFilesRecursively(SANDBOX_DIR);
    } else {
      files = await fs.readdir(SANDBOX_DIR).then(files => files.map(f => ({ path: f })));
    }
    console.log('List response:', files);
    res.json({ files });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to list files recursively
async function listFilesRecursively(dir, basePath = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await listFilesRecursively(path.join(dir, entry.name), relativePath);
      files.push(...subFiles);
    } else {
      files.push({ path: relativePath });
    }
  }

  return files;
}

app.delete('/sandbox/delete', async (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });
  try {
    const fullPath = path.join(SANDBOX_DIR, filePath);
    await fs.unlink(fullPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sandbox/run', async (req, res) => {
  const { file } = req.body;
  const filePath = path.join(SANDBOX_DIR, file);
  
  try {
    await fs.access(filePath);
    const reqPath = path.join(SANDBOX_DIR, 'requirements.txt');
    if (await fs.access(reqPath).then(() => true).catch(() => false)) {
      await new Promise((resolve, reject) => {
        exec(`pip install -r ${reqPath}`, { cwd: SANDBOX_DIR }, (err, stdout, stderr) => {
          if (err) reject(new Error(`pip install failed: ${stderr}`));
          else resolve(stdout);
        });
      });
    }
    await new Promise((resolve, reject) => {
      exec(`python ${filePath}`, { cwd: SANDBOX_DIR }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    }).then(stdout => {
      res.json({ success: true, output: stdout });
    }).catch(error => {
      res.json({ success: false, error: error.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Sandbox server running at http://localhost:${port}`);
});
