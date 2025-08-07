/**
 * Component Type Definitions for ThinkSpace
 * 
 * Type definitions for React components, props, and UI-related
 * types used throughout the ThinkSpace application.
 */

import { ReactNode, ComponentProps, HTMLAttributes } from 'react';
import { 
  User, 
  Project, 
  Area, 
  Resource, 
  Note, 
  Chat, 
  Message,
  ProjectStatus,
  ProjectPriority,
  AreaType,
  ResourceType,
  NoteType,
  ChatType
} from '@prisma/client';

// Base Component Types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean;
  loadingText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface ErrorProps extends BaseComponentProps {
  error?: string | Error | null;
  onRetry?: () => void;
  showRetry?: boolean;
}

// Layout Component Types
export interface LayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
  user?: User;
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface SidebarProps extends BaseComponentProps {
  collapsed?: boolean;
  onToggle?: () => void;
  user?: User;
  currentPath?: string;
}

export interface HeaderProps extends BaseComponentProps {
  title?: string;
  user?: User;
  showSearch?: boolean;
  showNotifications?: boolean;
  onSearch?: (query: string) => void;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

// Form Component Types
export interface FormProps extends BaseComponentProps {
  onSubmit: (data: any) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  initialValues?: Record<string, any>;
  validationSchema?: any;
}

export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'url' | 'search';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface TextareaProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  autoResize?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface CheckboxProps extends BaseComponentProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

export interface RadioProps extends BaseComponentProps {
  label?: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  name: string;
  disabled?: boolean;
}

export interface SwitchProps extends BaseComponentProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// Button Component Types
export interface ButtonProps extends BaseComponentProps {
  variant?: 'filled' | 'outline' | 'light' | 'subtle' | 'transparent';
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface ActionIconProps extends BaseComponentProps {
  variant?: 'filled' | 'outline' | 'light' | 'subtle' | 'transparent';
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label': string;
}

// Card Component Types
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withBorder?: boolean;
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Modal Component Types
export interface ModalProps extends BaseComponentProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  withCloseButton?: boolean;
  overlayOpacity?: number;
}

export interface DrawerProps extends BaseComponentProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: number | string;
  withCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

// Table Component Types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
  scroll?: { x?: number | string; y?: number | string };
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// List Component Types
export interface ListItemProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: ReactNode;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

export interface ListProps extends BaseComponentProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  loadMore?: () => void;
  hasMore?: boolean;
}

// PARA Entity Component Types
export interface ProjectCardProps extends BaseComponentProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onView?: (project: Project) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface ProjectFormProps extends BaseComponentProps {
  project?: Project;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

export interface AreaCardProps extends BaseComponentProps {
  area: Area;
  onEdit?: (area: Area) => void;
  onDelete?: (area: Area) => void;
  onView?: (area: Area) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface AreaFormProps extends BaseComponentProps {
  area?: Area;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

export interface ResourceCardProps extends BaseComponentProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onView?: (resource: Resource) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface ResourceFormProps extends BaseComponentProps {
  resource?: Resource;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

export interface NoteCardProps extends BaseComponentProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onView?: (note: Note) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface NoteFormProps extends BaseComponentProps {
  note?: Note;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

export interface NoteEditorProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
  showToolbar?: boolean;
  autoFocus?: boolean;
}

// Chat Component Types
export interface ChatProps extends BaseComponentProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (content: string) => void | Promise<void>;
  loading?: boolean;
  user?: User;
}

export interface MessageProps extends BaseComponentProps {
  message: Message;
  user?: User;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export interface ChatInputProps extends BaseComponentProps {
  onSend: (content: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

// Search Component Types
export interface SearchProps extends BaseComponentProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: SearchFilter[];
}

export interface SearchFilter {
  key: string;
  label: string;
  type: 'select' | 'checkbox' | 'date' | 'range';
  options?: SelectOption[];
  value?: any;
  onChange?: (value: any) => void;
}

export interface SearchResultsProps extends BaseComponentProps {
  results: any[];
  loading?: boolean;
  query?: string;
  total?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  renderResult?: (result: any, index: number) => ReactNode;
}

// Graph Component Types
export interface GraphVisualizationProps extends BaseComponentProps {
  data: {
    nodes: any[];
    relationships: any[];
  };
  width?: number;
  height?: number;
  onNodeClick?: (node: any) => void;
  onRelationshipClick?: (relationship: any) => void;
  config?: {
    nodeSize?: number;
    linkDistance?: number;
    charge?: number;
    showLabels?: boolean;
    colorScheme?: string;
  };
}

// File Upload Component Types
export interface FileUploadProps extends BaseComponentProps {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  loading?: boolean;
  disabled?: boolean;
  description?: string;
}

export interface FileListProps extends BaseComponentProps {
  files: any[];
  onDelete?: (file: any) => void;
  onDownload?: (file: any) => void;
  onPreview?: (file: any) => void;
  loading?: boolean;
}

// Notification Component Types
export interface NotificationProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean | number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme Types
export interface ThemeConfig {
  colorScheme: 'light' | 'dark';
  primaryColor: string;
  fontFamily: string;
  headings: {
    fontFamily: string;
    sizes: Record<string, any>;
  };
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadows: Record<string, string>;
  breakpoints: Record<string, number>;
}

// Animation Types
export interface AnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
  playState?: 'running' | 'paused';
}

// Responsive Types
export interface ResponsiveValue<T> {
  base?: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

// Event Handler Types
export type ClickHandler = () => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;
export type ErrorHandler = (error: Error) => void;

// Utility Component Types
export interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
  children: ReactNode;
}

export interface PortalProps {
  children: ReactNode;
  target?: HTMLElement | string;
}

export interface LazyProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}
