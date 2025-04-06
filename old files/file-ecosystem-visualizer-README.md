# ART Ecosystem Visualizer

A cyberpunk-themed visualization tool for exploring the file relationships in the ART project.

## Features

- Interactive 3D force-directed graph visualization
- Color coding by file type, size, or last modified date
- Detailed file information panel
- Connection exploration between files
- Cyberpunk/space visual theme

## How to Use

### Step 1: Generate the File Data (Optional)

Run the scanner script to analyze your project files and generate relationship data:

```bash
node file-ecosystem-scanner.js
```

This will:
- Scan all files in the ART project directory
- Analyze file dependencies (imports, requires, etc.)
- Generate a `file-ecosystem-data.json` file with the results

> Note: If you skip this step, the visualizer will use sample data.

### Step 2: Open the Visualizer

Simply open the HTML file in your browser:

```bash
# On Windows
start file-ecosystem-visualizer.html

# On macOS
open file-ecosystem-visualizer.html

# On Linux
xdg-open file-ecosystem-visualizer.html
```

### Step 3: Interact with the Visualization

- **Pan**: Click and drag in empty space
- **Zoom**: Use mouse wheel or pinch gesture
- **Rotate**: Right-click and drag (or two-finger drag)
- **Select a file**: Click on any node to view its details
- **View connections**: When a file is selected, its connections are shown in the info panel
- **Navigate to connected file**: Click on a connection in the info panel
- **Change color scheme**: Use the dropdown in the top-right corner
- **Refresh data**: Click the "Refresh Data" button to reload the visualization

## Visualization Options

- **Color by File Type**: Colors nodes based on their file extension (JS, HTML, CSS, etc.)
- **Color by File Size**: Uses a color gradient to represent file sizes
- **Color by Last Modified**: Shows recently modified files with warmer colors

## Technical Details

The visualizer uses:
- **D3.js**: For data visualization and color scales
- **Force Graph**: For the 3D force-directed graph layout
- **Node.js**: For the file scanner script

The scanner analyzes:
- JavaScript/TypeScript imports and requires
- HTML script and link tags
- CSS imports
- File metadata (size, modification date)

## Customization

You can customize the visualization by editing:
- Color schemes in the CSS variables
- File type colors in the `fileTypeColors` object
- Visualization parameters in the `initGraph` function
