# ThinkSpace - Chat-First Knowledge Management System

A modern, AI-powered knowledge management application built with Next.js, featuring a conversational interface for capturing, organizing, and retrieving information using the PARA methodology with advanced graph database capabilities.

## 🚀 Features

- **Chat-First Interface**: Natural language interaction as the primary method of engagement
- **PARA-Inspired Organization**: Projects, Areas, Resources, and Archive structure
- **Intelligent Search**: Semantic search capabilities across your entire knowledge base
- **Visual Knowledge Mapping**: Interactive graph visualization using Neo4j for complex relationship analysis
- **AI-Assisted Organization**: Automatic categorization and connection suggestions
- **Multi-Format Support**: Import PDFs, images, websites, videos, and more
- **Real-time Collaboration**: Live updates and collaborative features
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices with Mantine UI
- **Advanced Graph Analytics**: Deep insights through Neo4j graph database queries
- **Semantic Relationships**: AI-powered relationship discovery and visualization

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** - Full-stack React framework with App Router
- **React 18+** - UI library with modern hooks and server components
- **Mantine 7+** - Feature-rich React components library with native dark theme support
- **TypeScript** - Type-safe JavaScript
- **Tabler Icons** - Beautiful icon set (Mantine's recommended icons)
- **React Hook Form** - Performant forms with validation
- **Mantine Form** - Enhanced form handling with Mantine components
- **Mantine Spotlight** - Command palette for quick navigation
- **Mantine Notifications** - Toast notifications system

### Backend & Database
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Modern ORM with type safety for relational data
- **Neon PostgreSQL** - Serverless PostgreSQL database for structured data with pgvector
- **Neo4j** - Graph database for knowledge graphs and complex relationships
- **Neo4j JavaScript Driver** - Official Neo4j client for Node.js
- **Redis** - Caching layer for improved performance

### AI & Machine Learning
- **CopilotKit** - AI-powered chat interface
- **LangGraph** - AI agent orchestration
- **Vector Embeddings** - Semantic search capabilities stored in PostgreSQL with pgvector
- **Neo4j Vector Index** - Graph-native vector search for semantic relationships
- **OpenAI GPT-4** - Natural language processing and generation
- **Sentence Transformers** - Text embedding generation

### State Management & Utilities
- **Mantine Context** - UI state management (theme, notifications, modals)
- **React Context API** - Global application state management
- **Zustand** - Lightweight state management for complex flows
- **React Query** - Server state management and caching
- **Mantine Hooks** - Utility hooks for common UI patterns

## 📁 Project Structure

```
thinkspace/
├── README.md
├── next.config.js
├── mantine.config.ts
├── tsconfig.json
├── package.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── neo4j/
│   ├── schema.cypher
│   ├── migrations/
│   ├── seed.cypher
│   └── queries/
│       ├── relationships.cypher
│       ├── analytics.cypher
│       └── search.cypher
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [chatId]/
│   │   │   │       └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [projectId]/
│   │   │   │       └── page.tsx
│   │   │   ├── areas/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [areaId]/
│   │   │   │       └── page.tsx
│   │   │   ├── resources/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [resourceId]/
│   │   │   │       └── page.tsx
│   │   │   ├── archive/
│   │   │   │   └── page.tsx
│   │   │   ├── graph/
│   │   │   │   └── page.tsx
│   │   │   └── search/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── chat/
│   │   │   │   ├── route.ts
│   │   │   │   └── [chatId]/
│   │   │   │       └── route.ts
│   │   │   ├── projects/
│   │   │   │   ├── route.ts
│   │   │   │   └── [projectId]/
│   │   │   │       └── route.ts
│   │   │   ├── areas/
│   │   │   │   ├── route.ts
│   │   │   │   └── [areaId]/
│   │   │   │       └── route.ts
│   │   │   ├── resources/
│   │   │   │   ├── route.ts
│   │   │   │   └── [resourceId]/
│   │   │   │       └── route.ts
│   │   │   ├── graph/
│   │   │   │   ├── route.ts
│   │   │   │   ├── analytics/
│   │   │   │   │   └── route.ts
│   │   │   │   └── relationships/
│   │   │   │       └── route.ts
│   │   │   ├── search/
│   │   │   │   ├── route.ts
│   │   │   │   └── semantic/
│   │   │   │       └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx
│   │   │   ├── header.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── user-menu.tsx
│   │   ├── ui/
│   │   │   ├── custom-button.tsx
│   │   │   ├── custom-card.tsx
│   │   │   ├── custom-input.tsx
│   │   │   ├── custom-modal.tsx
│   │   │   ├── loading-overlay.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   │   ├── chat-interface.tsx
│   │   │   │   ├── message-bubble.tsx
│   │   │   │   ├── chat-input.tsx
│   │   │   │   ├── chat-history.tsx
│   │   │   │   └── typing-indicator.tsx
│   │   │   ├── projects/
│   │   │   │   ├── project-card.tsx
│   │   │   │   ├── project-grid.tsx
│   │   │   │   ├── project-form.tsx
│   │   │   │   ├── project-kanban.tsx
│   │   │   │   └── project-timeline.tsx
│   │   │   ├── areas/
│   │   │   │   ├── area-canvas.tsx
│   │   │   │   ├── area-card.tsx
│   │   │   │   ├── area-form.tsx
│   │   │   │   └── area-connections.tsx
│   │   │   ├── resources/
│   │   │   │   ├── resource-grid.tsx
│   │   │   │   ├── resource-card.tsx
│   │   │   │   ├── resource-importer.tsx
│   │   │   │   ├── resource-viewer.tsx
│   │   │   │   └── resource-processor.tsx
│   │   │   ├── graph/
│   │   │   │   ├── knowledge-graph.tsx
│   │   │   │   ├── graph-controls.tsx
│   │   │   │   ├── node-details.tsx
│   │   │   │   ├── graph-analytics.tsx
│   │   │   │   └── graph-filters.tsx
│   │   │   └── search/
│   │   │       ├── search-interface.tsx
│   │   │       ├── search-results.tsx
│   │   │       ├── search-filters.tsx
│   │   │       └── semantic-search.tsx
│   │   └── forms/
│   │       ├── project-form.tsx
│   │       ├── area-form.tsx
│   │       ├── resource-form.tsx
│   │       └── user-settings-form.tsx
│   ├── contexts/
│   │   ├── auth-context.tsx
│   │   ├── ui-context.tsx
│   │   ├── chat-context.tsx
│   │   ├── data-context.tsx
│   │   └── graph-context.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-chat.ts
│   │   ├── use-graph.ts
│   │   ├── use-search.ts
│   │   ├── use-api.ts
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── neo4j.ts
│   │   ├── redis.ts
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   ├── embeddings.ts
│   │   ├── graph-queries.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── projects.ts
│   │   ├── areas.ts
│   │   ├── resources.ts
│   │   ├── graph.ts
│   │   ├── search.ts
│   │   └── api.ts
│   └── utils/
│       ├── constants.ts
│       ├── formatters.ts
│       ├── validators.ts
│       ├── graph-algorithms.ts
│       └── embedding-utils.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── sample-files/
└── docs/
    ├── api.md
    ├── graph-setup.md
    ├── mantine-integration.md
    ├── deployment.md
    └── contributing.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Neon PostgreSQL database account
- Neo4j database (AuraDB or self-hosted)
- Redis instance (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/thinkspace.git
   cd thinkspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local` file:
   ```env
   # Neon PostgreSQL Database
   DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

   # Neo4j Database
   NEO4J_URI="neo4j+s://your-neo4j-instance.databases.neo4j.io"
   NEO4J_USERNAME="neo4j"
   NEO4J_PASSWORD="your-password"

   # Redis (optional)
   REDIS_URL="redis://localhost:6379"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # AI Services
   OPENAI_API_KEY="your-openai-api-key"
   ANTHROPIC_API_KEY="your-anthropic-api-key"

   # Mantine Configuration
   MANTINE_THEME="light" # or "dark"
   MANTINE_COLOR_SCHEME="auto"

   # File Upload
   UPLOAD_MAX_SIZE="10485760" # 10MB
   ALLOWED_FILE_TYPES="pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,mp3"
   ```

4. **Set up the databases**
   ```bash
   # Setup PostgreSQL with Prisma
   npx prisma generate
   npx prisma db push
   npx prisma db seed

   # Setup Neo4j schema and constraints
   npm run neo4j:setup
   npm run neo4j:seed

   # Create vector indexes
   npm run db:create-vector-indexes
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Architecture

### PostgreSQL (Neon) - Structured Data
The application uses Prisma with Neon PostgreSQL for structured data with pgvector extension for embeddings. Key models include:

- **User** - Authentication and user preferences
- **Note** - Individual knowledge items with vector embeddings
- **Project** - Time-bound initiatives with goals and deadlines
- **Area** - Ongoing responsibilities and interests
- **Resource** - External references and imported content with content extraction
- **Chat** - Conversation sessions with context awareness
- **Message** - Individual chat messages with metadata
- **GraphSnapshot** - Cached graph states for performance optimization

### Neo4j - Knowledge Graph
Neo4j handles complex relationships and knowledge graphs with advanced analytics:

- **Entities** - All knowledge items (Projects, Areas, Resources, Notes) as nodes
- **Relationships** - Semantic connections between entities with strength metrics
- **Clusters** - AI-generated topic and theme groupings
- **Embeddings** - Vector representations stored as node properties
- **Temporal** - Time-based relationship evolution tracking
- **Analytics** - Centrality, community detection, and influence metrics

#### Graph Schema Features:

- **Semantic Similarity**: AI-powered relationship discovery
- **Temporal Evolution**: Track how relationships change over time
- **Community Detection**: Automatic clustering of related content
- **Centrality Metrics**: Identify important nodes and connections
- **Path Finding**: Discover connections between distant concepts
- **Recommendation Engine**: Suggest related content based on graph structure

View the complete schemas in `prisma/schema.prisma` and `neo4j/schema.cypher`.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript compiler check
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to PostgreSQL
- `npm run db:seed` - Seed PostgreSQL with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset PostgreSQL and reseed
- `npm run db:create-vector-indexes` - Create pgvector indexes

### Neo4j Scripts

- `npm run neo4j:setup` - Setup Neo4j schema and constraints
- `npm run neo4j:seed` - Seed Neo4j with sample data
- `npm run neo4j:console` - Open Neo4j Browser
- `npm run neo4j:backup` - Create graph database backup
- `npm run neo4j:restore` - Restore from backup

### Analysis & Maintenance

- `npm run graph:analyze` - Run graph analytics and metrics
- `npm run graph:cleanup` - Clean orphaned relationships
- `npm run embeddings:generate` - Generate missing embeddings
- `npm run embeddings:update` - Update existing embeddings

### Mantine Development

- `npm run mantine:dev` - Development with Mantine dev tools
- `npm run mantine:build-css` - Build custom Mantine CSS
- `npm run theme:generate` - Generate theme variations

## 🎨 Mantine Configuration

The project uses Mantine's comprehensive theming system with custom extensions:

```typescript
// mantine.config.ts
import { MantineProvider, createTheme, rem } from '@mantine/core';
import { IconBrain, IconGraph, IconMessages } from '@tabler/icons-react';

export const theme = createTheme({
  primaryColor: 'blue',
  defaultGradient: { from: 'blue', to: 'cyan', deg: 45 },
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Monaco, Courier, monospace',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: rem(24), lineHeight: '1.3', fontWeight: '600' },
      h3: { fontSize: rem(20), lineHeight: '1.4', fontWeight: '600' },
    },
  },
  colors: {
    // Custom color palette for knowledge management
    knowledge: [
      '#f0f9ff',
      '#e0f2fe', 
      '#bae6fd',
      '#7dd3fc',
      '#38bdf8',
      '#0ea5e9',
      '#0284c7',
      '#0369a1',
      '#075985',
      '#0c4a6e'
    ],
    graph: [
      '#fefce8',
      '#fef9c3',
      '#fef08a', 
      '#facc15',
      '#eab308',
      '#ca8a04',
      '#a16207',
      '#854d0e',
      '#713f12',
      '#422006'
    ]
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 200ms ease',
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        padding: 'lg',
        withBorder: true,
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },
    AppShell: {
      styles: {
        main: {
          minHeight: '100vh',
        },
      },
    },
  },
  other: {
    // Custom theme properties
    knowledge: {
      borderRadius: rem(8),
      spacing: rem(16),
    },
  },
});

// Custom Mantine components context
export const ThinkSpaceIcons = {
  brain: IconBrain,
  graph: IconGraph,
  messages: IconMessages,
};
```

### Component Development with Mantine

Components leverage Mantine's comprehensive component library with custom extensions:

```tsx
// components/ui/custom-card.tsx
import { 
  Card, 
  Text, 
  Badge, 
  Group, 
  ActionIcon, 
  Menu,
  Tooltip,
  useMantineTheme 
} from '@mantine/core';
import { 
  IconHeart, 
  IconBookmark, 
  IconShare,
  IconDots,
  IconEdit,
  IconTrash 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface KnowledgeCardProps {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'area' | 'resource' | 'note';
  status?: string;
  tags?: string[];
  connections?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function KnowledgeCard({ 
  id,
  title, 
  description, 
  type,
  status,
  tags = [],
  connections = 0,
  onEdit,
  onDelete,
  onFavorite,
  onShare 
}: KnowledgeCardProps) {
  const theme = useMantineTheme();
  
  const typeColors = {
    project: 'blue',
    area: 'green', 
    resource: 'orange',
    note: 'violet'
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit':
        onEdit?.(id);
        break;
      case 'delete':
        onDelete?.(id);
        notifications.show({
          title: 'Item deleted',
          message: `${title} has been deleted`,
          color: 'red',
        });
        break;
      case 'favorite':
        onFavorite?.(id);
        notifications.show({
          title: 'Added to favorites',
          message: `${title} has been favorited`,
          color: 'pink',
        });
        break;
      case 'share':
        onShare?.(id);
        break;
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.shadows.sm;
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group>
          <Badge color={typeColors[type]} variant="light" size="sm">
            {type}
          </Badge>
          {status && (
            <Badge variant="outline" size="sm">
              {status}
            </Badge>
          )}
        </Group>
        
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEdit size="0.875rem" />}
              onClick={() => handleAction('edit')}
            >
              Edit
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconShare size="0.875rem" />}
              onClick={() => handleAction('share')}
            >
              Share
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconTrash size="0.875rem" />}
              color="red"
              onClick={() => handleAction('delete')}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Text fw={500} size="lg" mb="xs" lineClamp={2}>
        {title}
      </Text>

      <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
        {description}
      </Text>

      {tags.length > 0 && (
        <Group gap="xs" mb="md">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="dot" size="xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="dot" size="xs" color="gray">
              +{tags.length - 3} more
            </Badge>
          )}
        </Group>
      )}

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {connections} connections
        </Text>
        
        <Group gap="xs">
          <Tooltip label="Add to favorites">
            <ActionIcon 
              variant="subtle" 
              color="pink"
              onClick={() => handleAction('favorite')}
            >
              <IconHeart size="1rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Bookmark">
            <ActionIcon variant="subtle" color="blue">
              <IconBookmark size="1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
}
```

## 🧪 Testing

The project includes comprehensive testing setup with Mantine testing utilities:

```bash
# Run all tests
npm run test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Test Mantine components
npm run test:mantine

# Test graph operations
npm run test:graph

# Test API endpoints
npm run test:api
```

### Testing Stack:

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **Mantine Testing Utils** - Mantine-specific testing helpers
- **Playwright** - End-to-end testing
- **MSW** - API mocking for tests
- **Neo4j Test Harness** - Graph database testing
- **Prisma Test Environment** - Database testing utilities

## 📱 Features Overview

### Chat Interface with Mantine

- **Chat UI**: Built with Mantine's ScrollArea, TextInput, ActionIcon, and Timeline
- **Message Display**: Custom MessageBubble components with rich text support
- **Real-time Updates**: Integrated with Mantine's notification system
- **File Attachments**: Mantine's Dropzone with drag-and-drop support
- **Voice Input**: Custom integration with Web Speech API
- **Context Awareness**: Visual indicators for different conversation contexts
- **Command Palette**: Mantine Spotlight for quick actions

### Project Management

- **Project Dashboard**: Responsive grid using Mantine's SimpleGrid
- **Project Cards**: Custom cards with progress indicators using Progress and RingProgress
- **Kanban Board**: Drag-and-drop implementation with @dnd-kit and Mantine components
- **Timeline View**: Project milestones using Mantine's Timeline component
- **Status Management**: Select and Badge components for status tracking
- **Deadline Tracking**: DatePicker with notification integration
- **Quick Actions**: Menu and ActionIcon for rapid task management

### Knowledge Graph Visualization

- **Interactive Graph**: Custom D3.js/Vis.js integration with Mantine theming
- **Graph Controls**: SegmentedControl, Slider, and MultiSelect for filtering
- **Node Details**: Modal and Drawer for detailed information display
- **Relationship Explorer**: Custom components for traversing connections
- **Analytics Dashboard**: Charts using recharts with Mantine styling
- **Export Options**: Menu with multiple format support (PNG, SVG, JSON)
- **Search Integration**: Spotlight search within graph context

### Resource Management

- **Resource Library**: DataTable with sorting, filtering, and pagination
- **Import Interface**: Enhanced Dropzone with progress tracking
- **Preview System**: Modal with content-specific viewers
- **Batch Operations**: Checkbox groups with bulk action toolbar
- **File Processing**: Progress indicators with real-time status updates
- **Metadata Editor**: Form components for tag and description management
- **Search & Filter**: Advanced filtering with MultiSelect and TagInput

### Advanced Search

- **Semantic Search**: AI-powered search with result ranking
- **Full-text Search**: PostgreSQL full-text search integration
- **Graph Search**: Neo4j-powered relationship-based search
- **Filter Interface**: Comprehensive filtering using Mantine form components
- **Search History**: Persistent search history with quick access
- **Saved Searches**: Bookmark complex queries for reuse

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Enable automatic deployments

2. **Configure Environment Variables**
   ```bash
   # Add in Vercel dashboard
   DATABASE_URL="postgresql://..."
   NEO4J_URI="neo4j+s://..."
   NEO4J_USERNAME="neo4j"
   NEO4J_PASSWORD="..."
   NEXTAUTH_SECRET="..."
   OPENAI_API_KEY="..."
   ```

3. **Database Setup**
   ```bash
   # Run after deployment
   npx prisma generate
   npx prisma db push
   npm run neo4j:setup
   ```

## 🤝 Contributing

Please read our [Contributing Guide](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Mantine](https://mantine.dev/) - Amazing React components library
- Powered by [Next.js](https://nextjs.org/) - The React framework for production
- Graph database by [Neo4j](https://neo4j.com/) - The world's leading graph database
- Vector search by [Neon](https://neon.tech/) - Serverless PostgreSQL with pgvector
