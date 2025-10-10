# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PKPM Agent is a Next.js chat interface application built on top of LangChain's Agent Chat UI. It provides a Chinese-language interface for interacting with AI agents specialized in PKPM (建筑结构设计软件) tasks, including CAD drawing, model creation, modification, and computational result queries.

## Key Technologies

- **Next.js 15** with React 19 and TypeScript
- **LangChain/LangGraph SDK** for agent communication
- **Tailwind CSS** with Radix UI components
- **Framer Motion** for animations
- **pnpm** as package manager

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Architecture Overview

### Provider Structure
The application uses a hierarchical provider structure:
1. **ThreadProvider** - Manages thread state and history
2. **StreamProvider** - Handles LangGraph streaming connections and setup UI
3. **ArtifactProvider** - Manages side-panel content display

### Key Components

**Main Chat Interface** (`src/components/thread/index.tsx`):
- Central chat component with message display
- File upload support (PDF, images)
- Model selection and tool configuration
- Chinese UI with PKPM-specific prompt suggestions

**Stream Management** (`src/providers/Stream.tsx`):
- Handles connection to LangGraph servers
- Configuration form for API URL, Assistant ID, and Model Config URL
- Chinese error handling and status messages

**Model Configuration** (`src/lib/model-config-api.ts`):
- API client for model configuration service
- Supports multiple model providers (OpenAI, Anthropic, etc.)
- Tool management and connectivity checking

### Configuration

**Environment Variables:**
- `NEXT_PUBLIC_API_URL` - LangGraph server URL (default: http://localhost:2024)
- `NEXT_PUBLIC_ASSISTANT_ID` - Assistant/Graph ID (default: agent)
- `NEXT_PUBLIC_MODEL_CONFIG_URL` - Model config service URL (default: http://localhost:1013)

**URL Parameters:**
The application supports URL parameters for configuration that override environment variables:
- `apiUrl` - LangGraph server URL
- `assistantId` - Assistant/Graph ID
- `modelConfigUrl` - Model configuration service URL
- `threadId` - Thread identifier for conversation persistence

## Key Features

### Multilingual Support
- Primary interface in Chinese
- PKPM-specific terminology and prompts
- Localized error messages and notifications

### File Handling
- Drag-and-drop file upload
- Support for PDF and image formats
- Content block preview system

### Agent Integration
- Real-time streaming with LangGraph
- Tool call visualization and management
- Message regeneration capabilities
- Conversation history persistence

### Artifact System
- Side-panel content display
- Context-aware artifact rendering
- Collapsible interface for better UX

## Development Notes

### Message Flow
1. User input is captured in the main Thread component
2. Messages are sent through the StreamProvider to LangGraph
3. Streaming responses are handled by the useStream hook
4. UI updates are managed through React state and context

### Model Configuration
The application communicates with a separate model configuration service (port 1013) for:
- Managing multiple AI model configurations
- Switching between different model providers
- Enabling/disabling tool sets
- Connectivity checking

### Production Build
The application is configured for static export:
```javascript
output: "export"
assetPrefix: "./"
images: { unoptimized: true }
```

### Component Structure
- UI components in `src/components/ui/` (shadcn/ui based)
- Message components in `src/components/thread/messages/`
- Icon components in `src/components/icons/`
- Utilities and hooks in `src/lib/` and `src/hooks/`

## Testing and Deployment

For production deployment with LangGraph:
1. Set `LANGGRAPH_API_URL` to your deployment URL
2. Set `NEXT_PUBLIC_API_URL` to your website + "/api"
3. Set `LANGSMITH_API_KEY` for authentication
4. The application includes API passthrough functionality via `langgraph-nextjs-api-passthrough`