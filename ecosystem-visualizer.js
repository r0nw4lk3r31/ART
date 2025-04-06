const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const config = {
  port: process.env.PORT || 4000,
  ignoreDirs: ['__pycache__', 'node_modules', '.git', 'dist', 'build'],
  ignoreFiles: ['.DS_Store', 'ecosystem-visualizer.js', 'ecosystem.html', 'package-lock.json', '.gitignore'],
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md'],
  rootFiles: ['ecosystem-visualizer.js', 'package.json'] // Updated to match filename
};
const ROOT_DIR = path.resolve(__dirname);

let nodes = [];
let links = [];
let nodeMap = new Map();
let cachedData = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

async function scanDirectory(dirPath, relativePath = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  console.log(`Scanning directory: ${dirPath}, found ${entries.length} entries`);
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const entryRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      if (config.ignoreDirs.includes(entry.name) || entryRelativePath.includes('/node_modules/')) {
        console.log(`Skipping dir: ${entryRelativePath}`);
        continue;
      }
      const nodeId = String(nodes.length + 1);
      nodes.push({ id: nodeId, name: entry.name, path: entryRelativePath, type: 'folder', cluster: entryRelativePath });
      nodeMap.set(entryRelativePath, nodeId);
      await scanDirectory(entryPath, entryRelativePath);
    } else if (!config.ignoreFiles.includes(entry.name) && !entry.name.endsWith('.download')) {
      const stats = await fs.stat(entryPath);
      let lineCount = 0;
      if (config.codeExtensions.includes(path.extname(entry.name))) {
        const content = await fs.readFile(entryPath, 'utf8');
        lineCount = content.split('\n').length;
      }
      const nodeId = String(nodes.length + 1);
      const cluster = path.extname(entry.name) === '.tsx' ? 'tsx' : path.dirname(entryRelativePath);
      const node = {
        id: nodeId,
        name: entry.name,
        path: entryRelativePath,
        type: 'file',
        cluster: cluster,
        isRoot: config.rootFiles.includes(entry.name) && relativePath === '',
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        lineCount: lineCount
      };
      nodes.push(node);
      nodeMap.set(entryRelativePath, nodeId);
      console.log(`Added node: ${entryRelativePath}`);
    } else {
      console.log(`Skipping file: ${entryRelativePath}`);
    }
  }
}

function addContainmentAndClusterLinks() {
  nodes.forEach(node => {
    if (node.type === 'file') {
      const parentDir = path.dirname(node.path);
      const parentId = nodeMap.get(parentDir);
      if (parentId && parentId !== node.id) {
        links.push({ source: parentId, target: node.id, type: 'containment' });
        console.log(`Added containment link: ${parentId} -> ${node.id}`);
      }
    }
  });

  const rootNode = nodes.find(n => n.path === '');
  if (rootNode) {
    const clusters = [...new Set(nodes.map(n => n.cluster).filter(c => c && c !== ''))];
    clusters.forEach(cluster => {
      const clusterNodes = nodes.filter(n => n.cluster === cluster);
      if (clusterNodes.length > 0) {
        const repNode = clusterNodes[0];
        links.push({ source: rootNode.id, target: repNode.id, type: 'cluster' });
        console.log(`Added cluster link: ${rootNode.id} -> ${repNode.id}`);
      }
    });
  }
}

function getConnectedNodes(nodeId, links, nodes) {
  const direct = new Set();
  const indirect = new Set();

  links.forEach(link => {
    if (link.source.id === nodeId) direct.add(link.target.id);
    if (link.target.id === nodeId) direct.add(link.source.id);
  });

  const visited = new Set([nodeId]);
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    links.forEach(link => {
      let nextId;
      if (link.source.id === current && !visited.has(link.target.id)) {
        nextId = link.target.id;
      } else if (link.target.id === current && !visited.has(link.source.id)) {
        nextId = link.source.id;
      }
      if (nextId && !visited.has(nextId)) {
        visited.add(nextId);
        indirect.add(nextId);
        queue.push(nextId);
      }
    });
  }

  direct.forEach(id => indirect.delete(id));
  return { direct: Array.from(direct), indirect: Array.from(indirect) };
}

async function generateGraphData() {
  nodes = [];
  links = [];
  nodeMap.clear();
  console.time('generateGraphData');
  await scanDirectory(ROOT_DIR);
  if (!nodeMap.get('')) {
    nodes.push({ id: '0', name: path.basename(ROOT_DIR), path: '', type: 'folder', cluster: '', fx: 0, fy: 0 });
    nodeMap.set('', '0');
  }
  addContainmentAndClusterLinks();

  nodes.forEach(node => {
    const { direct, indirect } = getConnectedNodes(node.id, links, nodes);
    node.directConnections = direct.length;
    node.indirectConnections = indirect.length;
    node.connectedNodes = { direct, indirect };
  });

  console.timeEnd('generateGraphData');
  console.log(`Generated ${nodes.length} nodes and ${links.length} links`);
  return { nodes, links };
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ecosystem.html'));
});

app.get('/data', async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedData || now - lastCacheTime > CACHE_DURATION) {
      cachedData = await generateGraphData();
      lastCacheTime = now;
    }
    console.log('Sending data to client:', JSON.stringify(cachedData, null, 2));
    res.json(cachedData);
  } catch (error) {
    console.error('Error generating graph data:', error);
    res.status(500).json({ error: 'Failed to generate graph data' });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});