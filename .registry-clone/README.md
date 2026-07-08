# Zon File Management System

A comprehensive file management system for Val Town that handles different file types including HTTP, cron, email, JSON, and more with collaborative editing capabilities.

## Features

- **Multi-file type support**: HTTP, cron, email, JSON, TypeScript, and more
- **Specialized editors**: Dedicated editors for different file types with type-specific features
- **Collaborative editing**: Real-time collaboration using YJS with ts-editor component
- **TypeScript editor**: Full-featured TypeScript editor with syntax highlighting
- **File type detection**: Automatic file type detection and routing to appropriate editors
- **KV-based storage**: Simple and reliable KV storage for all data
- **Configurable URLs**: All service URLs are configurable via config.json

## Architecture

### Hybrid Yjs + KV Design

1. **Sync Service** (`/sync`): 
   - Syncs Val Town files to **both** Yjs and KV storage
   - Stores complete zons list in KV for gallery view
   - Enables collaborative editing via Yjs
   - Provides reliable KV backup for HTTP services

2. **HTTP Services** (`/zons`, `/zon`, `/file.*`):
   - **Direct KV access** for fast, reliable data reads
   - **Simple and predictable** performance
   - **No complex middleware** or fallback logic

3. **Editor Integration**:
   - **ts-editor** connects to Yjs for real-time collaboration
   - **File content** synced to both Yjs (for collaboration) and KV (for HTTP services)

### Benefits

- **Best of Both Worlds**: Collaborative editing + simple HTTP services
- **Reliability**: KV storage ensures HTTP services always work
- **Performance**: Direct KV access for fast response times
- **Collaboration**: Yjs enables real-time collaborative editing
- **Simplicity**: HTTP services remain clean and straightforward

## Project Structure

```
├── config.json          # Configuration file with URLs and file type definitions
├── zons                 # Main gallery view showing all zons (HTTP)
├── zon                  # Individual zon view with file listings (HTTP)  
├── file                 # Original file editor (HTTP) - deprecated
├── file.http            # HTTP file editor with specialized features (HTTP)
├── file.cron            # Cron/interval file editor with scheduling features (HTTP)
├── file.email           # Email file editor with email-specific features (HTTP)
├── file.readme          # README/Markdown file editor with preview (HTTP)
├── file.default         # Default file editor for all other file types (HTTP)
├── sync                 # Background sync service for YJS collaboration (Cron)
└── README.md           # This file
```

## Configuration

The system uses `/config.json` for configuration:

```json
{
  "urls": {
    "zons": "https://zons.val.run",     // Main gallery URL
    "zon": "https://zon.val.run",       // Individual zon view URL  
    "files": "https://svc.val.run"      // File editor URL
  },
  "editor": {
    "yjs": {
      "room": "@vals",                   // YJS collaboration room
      "url": "wss://hp.cfapps.us10-001.hana.ondemand.com"  // YJS WebSocket URL
    }
  },
  "fileTypes": {
    // File type definitions with icons, colors, templates, etc.
  }
}
```

## File Types Supported

- **HTTP** (`http`) - Web endpoints and APIs
- **Cron** (`cron`) - Scheduled tasks  
- **Email** (`email`) - Email handlers
- **JSON** (`json`) - Configuration and data files
- **TypeScript** (`ts`) - General TypeScript files
- **JavaScript** (`js`) - JavaScript files
- **Markdown** (`md`) - Documentation files

## Routing

### Main Gallery (`/zons`)
- `GET /` - Main gallery showing all zons
- Displays all available zons with metadata

### Zon File Browser (`/zon`)  
- `GET /` - Redirects to main gallery
- `GET /{zon-name}` - View files in specific zon
- `GET /{zon-name}/files` - API endpoint returning JSON list of files
- Groups files by type and shows file metadata

### File Editor Services (`/file.*`)

The file editing system is now split into specialized handlers based on file type:

#### HTTP File Editor (`/file.http`)
- **Purpose**: Edit HTTP endpoint handlers
- **Features**: 
  - HTTP-specific UI with green theme
  - Direct "Run HTTP" button that opens the endpoint
  - Specialized templates for HTTP handlers
- **Handles**: Files with `type: "http"` or `type: "script"`

#### Cron File Editor (`/file.cron`) 
- **Purpose**: Edit scheduled task handlers
- **Features**:
  - Cron-specific UI with blue theme
  - "Schedule" button linking to Val Town scheduling UI
  - Templates for interval/cron handlers
- **Handles**: Files with `type: "interval"` or `type: "cron"`

#### Email File Editor (`/file.email`)
- **Purpose**: Edit email processing handlers
- **Features**:
  - Email-specific UI with purple theme
  - "Test Email" button for email testing
  - Templates for email handlers
- **Handles**: Files with `type: "email"`

#### README File Editor (`/file.readme`)
- **Purpose**: Edit documentation and README files
- **Features**:
  - Documentation-focused UI with gray theme
  - Markdown language support
  - Preview functionality (planned)
- **Handles**: Files named "README*", "*.md", or with `type: "md"`

#### Default File Editor (`/file.default`)
- **Purpose**: Edit all other file types (TypeScript, JavaScript, JSON, etc.)
- **Features**:
  - Generic file editing interface
  - Auto-detection of file types
  - Redirects specialized files to appropriate editors
- **Handles**: All files not handled by specialized editors

#### Legacy File Editor (`/file`)
- **Status**: Deprecated but maintained for compatibility
- **Purpose**: Original unified file editor
- **Recommendation**: Use specialized editors instead

### Routing for File Editors

Each specialized editor follows the same routing pattern:
- `GET /` - Redirects to main gallery
- `GET /{zon-name}/{file-name}` - Edit specific file with specialized interface
- `GET /{zon-name}/{file-name}/raw` - Get raw file content as JSON
- `POST /{zon-name}/{file-name}` - Save file changes

### File Type Detection and Routing

The system automatically routes files to the appropriate specialized editor:

1. **HTTP files** (`type: "http"` or `type: "script"`) → `file.http`
2. **Cron files** (`type: "interval"` or `type: "cron"`) → `file.cron`  
3. **Email files** (`type: "email"`) → `file.email`
4. **README files** (filename contains "readme", ends with ".md", or `type: "md"`) → `file.readme`
5. **All other files** → `file.default`

The `file.default` handler includes automatic redirection logic to send specialized files to their appropriate editors.
- `GET /` - Redirects to main gallery (configurable)
- `GET /{zon-name}/{file-name}` - Edit specific file with ts-editor
- `GET /{zon-name}/{file-name}/raw` - Get raw file content as JSON
- `POST /{zon-name}/{file-name}` - Save file changes

### Background Sync (`/sync`)
- Cron job that syncs Val Town files to YJS documents
- Enables real-time collaborative editing
- Runs periodically to keep YJS documents up to date

## Usage Flow

1. **Browse zons**: Visit main gallery to see all available zons
2. **Select zon**: Click on a zon to view its files grouped by type
3. **Edit file**: Click on a file to open it in the collaborative editor
4. **Save changes**: Use the Save button to persist changes back to Val Town
5. **Run HTTP files**: Use the Run button to test HTTP endpoints

## API Integration

The system integrates with:
- **Yjs**: Primary data source for real-time collaborative editing
- **KV Storage**: Backup data source when Yjs is not available or still connecting
- **ts-editor**: For TypeScript/JavaScript editing with syntax highlighting

## Data Flow

1. **Sync Service**: Syncs Val Town files to both Yjs (for collaboration) and KV (for HTTP services)
2. **HTTP Services**: Read directly from KV storage for all data needs
3. **Editor Integration**: ts-editor connects to Yjs for real-time collaborative editing
4. **Zons List**: Complete list of zons stored in KV for fast gallery loading

## KV Storage Structure

- `zons:list` - Complete list of all zons for gallery view
- `val:{valName}` - Val metadata (name, id, files list, etc.)
- `file:{valName}:{fileName}` - File metadata (type, path, etc.)
- `content:{valName}:{fileName}` - File content (up to 1MB per file)

## Hybrid Architecture Benefits

1. **HTTP Services**: Simple, fast KV reads with no complex logic
2. **Collaborative Editing**: Real-time collaboration via Yjs in the editor
3. **Data Reliability**: Dual storage ensures data availability
4. **Performance**: Direct KV access for predictable response times

## Development

- All URLs are configurable via `config.json`
- File types can be extended by adding to the `fileTypes` configuration
- Authorization is currently disabled for development (returns true)
- Error handling includes proper error propagation and user feedback