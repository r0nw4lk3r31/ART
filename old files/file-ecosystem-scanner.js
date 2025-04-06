const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Configuration
const ROOT_DIR = path.resolve(__dirname); // Current directory as root
const IGNORE_DIRS = [
  'node_modules', 
  '.git',
  '__pycache__'
];

const IGNORE_FILES = [
  '.DS_Store',
  'thumbs.db',
  'desktop.ini',
  'file-ecosystem-data.json'  // Ignore the output file itself
];

// File patterns to ignore (using glob patterns)
const IGNORE_PATTERNS = [];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size to read

// File extensions to analyze for dependencies
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', 
  '.json', '.md', '.cjs', '.mjs', '.py', '.php',
  '.rb', '.java', '.c', '.cpp', '.h', '.hpp'
];

// Regular expressions for finding dependencies
const IMPORT_REGEX = /import\s+(?:[\w*{}\s,]+from\s+)?["']([^"']+)["']/g;
const REQUIRE_REGEX = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
const SCRIPT_SRC_REGEX = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
const LINK_HREF_REGEX = /<link[^>]*href=["']([^"']+)["'][^>]*>/g;
const CSS_IMPORT_REGEX = /@import\s+(?:url\s*\()?\s*["']([^"']+)["']\s*\)?/g;
const REFERENCE_REGEX = /["']([^"']+\.[a-zA-Z0-9]{1,5})["']/g; // Find references to other files

// Data structures
let nodes = [];
let links = [];
let nodeMap = new Map(); // Map of file paths to node IDs
let filesByType = new Map(); // Map of file extensions to arrays of node IDs

/**
 * Check if a file should be ignored based on patterns
 */
function shouldIgnoreFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Check if file is in the ignore list
  if (IGNORE_FILES.some(pattern => {
    if (pattern.includes('*')) {
      return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(fileName);
    }
    return pattern === fileName;
  })) {
    return true;
  }
  
  // Check against ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      if (new RegExp(regexPattern).test(filePath)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Scan directory recursively
 */
async function scanDirectory(dirPath, relativePath = '') {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip ignored directories
        if (IGNORE_DIRS.some(dir => entry.name === dir || entryRelativePath.includes(`/${dir}/`))) {
          console.log(`Skipping ignored directory: ${entryRelativePath}`);
          continue;
        }
        
        // Recursively scan subdirectories
        await scanDirectory(entryPath, entryRelativePath);
      } else {
        // Skip ignored files
        if (shouldIgnoreFile(entry.name)) {
          console.log(`Skipping ignored file: ${entryRelativePath}`);
          continue;
        }
        
        // Process file
        await processFile(entryPath, entryRelativePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
}

/**
 * Process a single file
 */
async function processFile(filePath, relativePath) {
  try {
    const stats = await stat(filePath);
    
    // Skip files that are too large
    if (stats.size > MAX_FILE_SIZE) {
      console.log(`Skipping large file: ${relativePath} (${formatFileSize(stats.size)})`);
      return;
    }
    
    // Add node to the graph
    const nodeId = nodes.length + 1;
    const node = {
      id: nodeId,
      name: path.basename(filePath),
      path: relativePath,
      size: stats.size,
      lastModified: stats.mtime.getTime()
    };
    
    nodes.push(node);
    nodeMap.set(relativePath, nodeId);
    
    // Group files by extension for additional connections
    const ext = path.extname(filePath).toLowerCase();
    if (!filesByType.has(ext)) {
      filesByType.set(ext, []);
    }
    filesByType.get(ext).push(nodeId);
    
    // Analyze file content for dependencies if it's a code file
    if (CODE_EXTENSIONS.includes(ext)) {
      await analyzeDependencies(filePath, relativePath, nodeId);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * Analyze file dependencies
 */
async function analyzeDependencies(filePath, relativePath, nodeId) {
  try {
    const content = await readFile(filePath, 'utf8');
    const dependencies = new Set();
    
    // Find all imports
    let match;
    
    // ES6 imports
    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // CommonJS requires
    REQUIRE_REGEX.lastIndex = 0; // Reset regex index
    while ((match = REQUIRE_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // HTML script src
    SCRIPT_SRC_REGEX.lastIndex = 0;
    while ((match = SCRIPT_SRC_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // HTML link href
    LINK_HREF_REGEX.lastIndex = 0;
    while ((match = LINK_HREF_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // CSS imports
    CSS_IMPORT_REGEX.lastIndex = 0;
    while ((match = CSS_IMPORT_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // Find references to other files
    REFERENCE_REGEX.lastIndex = 0;
    while ((match = REFERENCE_REGEX.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // Process each dependency
    for (const dep of dependencies) {
      // Skip external dependencies (URLs, node_modules)
      if (dep.startsWith('http') || dep.startsWith('@')) {
        continue;
      }
      
      // Resolve the dependency path
      let resolvedPath = resolveDependencyPath(dep, relativePath);
      if (!resolvedPath) continue;
      
      // Find the target node
      const targetNodeId = nodeMap.get(resolvedPath);
      if (targetNodeId) {
        // Add link to the graph
        addLink(nodeId, targetNodeId, 2); // Higher weight for direct dependencies
      }
    }
  } catch (error) {
    console.error(`Error analyzing dependencies in ${filePath}:`, error);
  }
}

/**
 * Add a link between two nodes if it doesn't already exist
 */
function addLink(sourceId, targetId, weight = 1) {
  // Don't add self-links
  if (sourceId === targetId) return;
  
  // Check if link already exists
  const exists = links.some(link => 
    (link.source === sourceId && link.target === targetId) || 
    (link.source === targetId && link.target === sourceId)
  );
  
  if (!exists) {
    links.push({
      source: sourceId,
      target: targetId,
      weight: weight
    });
  }
}

/**
 * Resolve a dependency path relative to the importing file
 */
function resolveDependencyPath(dep, importerPath) {
  // Handle relative paths
  if (dep.startsWith('./') || dep.startsWith('../')) {
    const importerDir = path.dirname(importerPath);
    let resolvedPath = path.join(importerDir, dep);
    
    // Check if the path exists with an extension
    if (!path.extname(resolvedPath)) {
      for (const ext of CODE_EXTENSIONS) {
        const pathWithExt = resolvedPath + ext;
        if (nodeMap.has(pathWithExt)) {
          return pathWithExt;
        }
      }
      
      // Check for index files
      for (const ext of CODE_EXTENSIONS) {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (nodeMap.has(indexPath)) {
          return indexPath;
        }
      }
    }
    
    return resolvedPath;
  }
  
  // Handle absolute paths (from project root)
  if (dep.startsWith('/')) {
    return dep.substring(1); // Remove leading slash
  }
  
  // Try to find the file in the project
  for (const nodePath of nodeMap.keys()) {
    if (nodePath.endsWith(dep)) {
      return nodePath;
    }
  }
  
  return null;
}

/**
 * Add additional connections between related files
 */
function addAdditionalConnections() {
  // Connect files in the same directory
  const filesByDir = new Map();
  
  nodes.forEach(node => {
    const dir = path.dirname(node.path);
    if (!filesByDir.has(dir)) {
      filesByDir.set(dir, []);
    }
    filesByDir.get(dir).push(node.id);
  });
  
  // Connect files in the same directory
  for (const [dir, nodeIds] of filesByDir.entries()) {
    // Skip directories with too many files to avoid cluttering
    if (nodeIds.length > 20) continue;
    
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        addLink(nodeIds[i], nodeIds[j], 1);
      }
    }
  }
  
  // Connect files of the same type (e.g., all .tsx files)
  for (const [ext, nodeIds] of filesByType.entries()) {
    // Skip extensions with too many files
    if (nodeIds.length > 20 || ext === '') continue;
    
    // Connect some files of the same type
    for (let i = 0; i < nodeIds.length; i++) {
      // Connect to a few other files of the same type
      const numConnections = Math.min(3, nodeIds.length - 1);
      for (let j = 1; j <= numConnections; j++) {
        const targetIndex = (i + j) % nodeIds.length;
        addLink(nodeIds[i], nodeIds[targetIndex], 1);
      }
    }
  }
  
  // Connect key files to ensure they're part of the web
  const keyFiles = ['server.js', 'package.json', 'AutoConversation.tsx', 'ChatModule.tsx', 'ExecutorChatModule.tsx'];
  const keyNodeIds = [];
  
  // Find node IDs for key files
  keyFiles.forEach(fileName => {
    for (const node of nodes) {
      if (node.name === fileName) {
        keyNodeIds.push(node.id);
        break;
      }
    }
  });
  
  // Connect key files to each other
  for (let i = 0; i < keyNodeIds.length; i++) {
    for (let j = i + 1; j < keyNodeIds.length; j++) {
      addLink(keyNodeIds[i], keyNodeIds[j], 3); // Higher weight for key file connections
    }
  }
  
  // Ensure all nodes have at least one connection
  nodes.forEach(node => {
    const hasConnection = links.some(link => 
      link.source === node.id || link.target === node.id
    );
    
    if (!hasConnection) {
      // Connect to a random node
      const targetId = Math.floor(Math.random() * nodes.length) + 1;
      if (targetId !== node.id) {
        addLink(node.id, targetId, 0.5); // Lower weight for random connections
      }
    }
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  console.log(`Scanning directory: ${ROOT_DIR}`);
  console.time('Scan completed in');
  
  // Reset data
  nodes = [];
  links = [];
  nodeMap = new Map();
  filesByType = new Map();
  
  // Scan the directory
  await scanDirectory(ROOT_DIR);
  
  // Add additional connections to create a web-like structure
  addAdditionalConnections();
  
  console.log(`Found ${nodes.length} files and ${links.length} dependencies`);
  console.timeEnd('Scan completed in');
  
  // Write the data to a JSON file
  const outputPath = path.join(ROOT_DIR, 'file-ecosystem-data.json');
  fs.writeFileSync(outputPath, JSON.stringify({ nodes, links }, null, 2));
  console.log(`Data written to ${outputPath}`);
}

// Run the main function
main().catch(console.error);
