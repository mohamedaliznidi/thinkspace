# ThinkSpace Graph Visualization System

A comprehensive, interactive graph visualization system for the ThinkSpace knowledge management application, built with Next.js 15, Mantine UI, and react-force-graph-2d.

## Features

### 🎯 Core Visualization
- **Interactive Network Graph**: Physics-based force-directed layout with zoom, pan, and drag capabilities
- **Multiple Layout Algorithms**: Force-directed, hierarchical, circular, grid, and radial layouts
- **Dynamic Node Sizing**: Nodes scale based on connection count and importance metrics
- **Relationship Visualization**: Different edge styles (solid, dashed, dotted) for various relationship types
- **PARA Category Color Coding**: Visual distinction between Projects (blue), Areas (purple), Resources (green), and Archives (gray)

### 🔍 Advanced Navigation
- **Node Selection**: Single and multi-select with Ctrl/Cmd support
- **Context Menus**: Right-click actions for editing, connecting, and managing nodes
- **Breadcrumb Navigation**: Track exploration paths through the knowledge graph
- **Focus Modes**: Overview, neighborhood, cluster, and time-filtered views
- **Search Integration**: Real-time visual search with highlighting

### 🔗 Relationship Management
- **Connection Types**: Direct references, shared tags, content similarity, temporal proximity
- **Strength Visualization**: Edge thickness and opacity based on relationship strength
- **Relationship Analytics**: Distribution charts and strength metrics
- **Dynamic Creation**: Add, edit, and delete relationships with visual feedback

### 📊 Analytics Dashboard
- **Pattern Recognition**: Identify knowledge hubs, isolated clusters, and orphaned content
- **Network Statistics**: Density, centrality scores, and growth trends
- **Visual Charts**: Donut charts, area charts, and progress indicators using Mantine Charts
- **Insights Generation**: Actionable recommendations based on graph analysis

### 🚀 Advanced Features
- **Visual Search**: Spotlight-powered search with real-time highlighting
- **Export Capabilities**: PNG, SVG, JSON, and CSV export options
- **Shareable Views**: Generate URLs with filters and selections
- **Keyboard Shortcuts**: Full keyboard navigation support

### 📱 Responsive Design
- **Multi-Device Support**: Optimized for desktop, tablet, and mobile devices
- **Adaptive Layouts**: Responsive configuration based on screen size
- **Touch Support**: Mobile-friendly interactions and gestures

### ♿ Accessibility
- **Screen Reader Support**: ARIA labels and live announcements
- **Keyboard Navigation**: Full keyboard control with arrow keys and shortcuts
- **High Contrast Mode**: Enhanced visibility options
- **Reduced Motion**: Respect user preferences for animations

## Architecture

### Components Structure
```
components/graph/
├── GraphVisualization.tsx          # Core visualization component
├── GraphNavigation.tsx             # Navigation and selection controls
├── RelationshipManager.tsx         # Relationship management interface
├── GraphAnalyticsDashboard.tsx     # Analytics and insights dashboard
├── GraphAdvancedFeatures.tsx       # Search, export, and sharing features
├── GraphLayoutEngine.tsx           # Layout algorithms and graph analysis
├── GraphResponsiveWrapper.tsx      # Responsive design and accessibility
└── index.ts                        # Component exports
```

### Data Flow
1. **Data Fetching**: `useGraphData` hook manages API calls and caching
2. **Layout Processing**: `useGraphLayout` applies selected layout algorithm
3. **Visualization**: `GraphVisualization` renders the interactive graph
4. **User Interaction**: Event handlers manage selection, navigation, and editing
5. **Analytics**: Real-time analysis of graph structure and patterns

## Usage

### Basic Implementation
```tsx
import { GraphVisualization, useGraphData } from '@/components/graph';

function MyGraphPage() {
  const { data, isLoading, error } = useGraphData();
  
  if (isLoading) return <Loader />;
  if (error) return <Alert>{error}</Alert>;
  
  return (
    <GraphVisualization
      data={data}
      config={{
        layout: 'force',
        showLabels: true,
        enableZoom: true,
      }}
      onNodeClick={(node, event) => {
        console.log('Node clicked:', node);
      }}
    />
  );
}
```

### With Responsive Wrapper
```tsx
import { GraphVisualization, GraphResponsiveWrapper } from '@/components/graph';

function ResponsiveGraph() {
  return (
    <GraphResponsiveWrapper
      data={data}
      config={config}
      enableAccessibility={true}
      enableKeyboardNavigation={true}
    >
      <GraphVisualization
        data={data}
        config={config}
        onNodeClick={handleNodeClick}
      />
    </GraphResponsiveWrapper>
  );
}
```

### Full Dashboard Implementation
```tsx
import {
  GraphVisualization,
  GraphNavigation,
  GraphAnalyticsDashboard,
  useGraphData,
} from '@/components/graph';

function GraphDashboard() {
  const { data, analytics } = useGraphData();
  const [selectedNodes, setSelectedNodes] = useState([]);
  
  return (
    <Grid>
      <Grid.Col span={3}>
        <GraphNavigation
          data={data}
          selectedNodes={selectedNodes}
          onNodeSelect={setSelectedNodes}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <GraphVisualization data={data} />
      </Grid.Col>
      <Grid.Col span={3}>
        <GraphAnalyticsDashboard
          data={data}
          analytics={analytics}
        />
      </Grid.Col>
    </Grid>
  );
}
```

## Configuration

### Graph Visualization Config
```typescript
interface GraphVisualizationConfig {
  width: number;
  height: number;
  layout: 'force' | 'hierarchical' | 'circular' | 'grid' | 'radial';
  nodeSize: {
    min: number;
    max: number;
    scale: 'linear' | 'log' | 'sqrt';
  };
  forceSettings: {
    linkDistance: number;
    linkStrength: number;
    chargeStrength: number;
    centerStrength: number;
    collisionRadius: number;
  };
  showLabels: boolean;
  showEdgeLabels: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  enableDrag: boolean;
  colorScheme: {
    projects: string;
    areas: string;
    resources: string;
    notes: string;
    edges: string;
    background: string;
  };
}
```

## API Integration

### Graph Data Endpoint
```typescript
// GET /api/graph
interface GraphApiResponse {
  success: boolean;
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: GraphStats;
  };
}
```

### Analytics Endpoint
```typescript
// GET /api/graph/analytics
interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: NetworkOverview;
    patterns: PatternAnalysis;
    trends: TrendAnalysis;
  };
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open search |
| `Ctrl+R` | Refresh graph |
| `Ctrl+0` | Zoom to fit |
| `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Arrow Keys` | Navigate nodes |
| `Enter/Space` | Select node |
| `Escape` | Clear selection |
| `?` | Show shortcuts |

## Performance Considerations

- **Virtualization**: Large graphs use canvas rendering for optimal performance
- **Debounced Updates**: Search and filter operations are debounced
- **Caching**: Graph data is cached with configurable TTL
- **Lazy Loading**: Components are dynamically imported to reduce bundle size
- **Memory Management**: Proper cleanup of event listeners and timers

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: WebGL support recommended for optimal performance

## Dependencies

- `react-force-graph-2d`: Interactive graph visualization
- `d3-force`: Physics simulation engine
- `@mantine/core`: UI components and theming
- `@mantine/hooks`: Utility hooks for responsive design
- `@mantine/charts`: Data visualization components

## Contributing

1. Follow the existing component structure and naming conventions
2. Add TypeScript types for all new interfaces
3. Include accessibility features in new components
4. Write unit tests for complex logic
5. Update documentation for new features

## License

This graph visualization system is part of the ThinkSpace application and follows the same licensing terms.
