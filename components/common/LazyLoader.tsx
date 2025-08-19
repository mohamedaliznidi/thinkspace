/**
 * Advanced Lazy Loading System for ThinkSpace
 * 
 * Provides intelligent lazy loading for components, images, and data
 * with intersection observer, preloading, and performance optimization.
 */

'use client';

import React, { 
  Suspense, 
  lazy, 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  ComponentType,
  ReactNode,
} from 'react';
import { 
  Loader, 
  Skeleton, 
  Card, 
  Stack, 
  Center, 
  Text,
  Alert,
  Button,
} from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

// Lazy loading configuration
interface LazyLoadConfig {
  threshold?: number; // Intersection threshold (0-1)
  rootMargin?: string; // Root margin for intersection observer
  preloadDistance?: number; // Distance in pixels to start preloading
  retryAttempts?: number; // Number of retry attempts on failure
  retryDelay?: number; // Delay between retries in ms
  enablePreloading?: boolean; // Enable intelligent preloading
  cacheComponents?: boolean; // Cache loaded components
}

// Default configuration
const DEFAULT_CONFIG: LazyLoadConfig = {
  threshold: 0.1,
  rootMargin: '50px',
  preloadDistance: 200,
  retryAttempts: 3,
  retryDelay: 1000,
  enablePreloading: true,
  cacheComponents: true,
};

// Component cache for lazy loaded components
const componentCache = new Map<string, ComponentType<any>>();

// Preload queue for intelligent preloading
const preloadQueue = new Set<string>();

// Error boundary for lazy loaded components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class LazyErrorBoundary extends React.Component<
  { children: ReactNode; onRetry: () => void; maxRetries: number },
  LazyErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.props.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
      }));
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert 
          color="red" 
          icon={<IconAlertCircle size="1rem" />}
          title="Loading Error"
        >
          <Stack gap="sm">
            <Text size="sm">
              Failed to load component. {this.state.error?.message}
            </Text>
            {this.state.retryCount < this.props.maxRetries && (
              <Button
                size="xs"
                variant="outline"
                leftSection={<IconRefresh size="0.8rem" />}
                onClick={this.handleRetry}
              >
                Retry ({this.state.retryCount + 1}/{this.props.maxRetries})
              </Button>
            )}
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Lazy component wrapper
interface LazyComponentProps {
  componentId: string;
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactNode;
  config?: Partial<LazyLoadConfig>;
  props?: any;
}

export function LazyComponent({
  componentId,
  loader,
  fallback,
  config = {},
  props = {},
}: LazyComponentProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [retryKey, setRetryKey] = useState(0);

  // Create lazy component with caching
  const LazyComp = React.useMemo(() => {
    if (finalConfig.cacheComponents && componentCache.has(componentId)) {
      return componentCache.get(componentId)!;
    }

    const component = lazy(async () => {
      try {
        const module = await loader();
        if (finalConfig.cacheComponents) {
          componentCache.set(componentId, module.default);
        }
        return module;
      } catch (error) {
        console.error(`Failed to load component ${componentId}:`, error);
        throw error;
      }
    });

    return component;
  }, [componentId, loader, finalConfig.cacheComponents, retryKey]);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  const defaultFallback = (
    <Card withBorder p="md">
      <Center>
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading component...</Text>
        </Stack>
      </Center>
    </Card>
  );

  return (
    <LazyErrorBoundary onRetry={handleRetry} maxRetries={finalConfig.retryAttempts!}>
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComp {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
}

// Intersection observer hook for lazy loading
function useIntersectionObserver(
  config: LazyLoadConfig
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [config.threshold, config.rootMargin]);

  return [ref, isIntersecting];
}

// Lazy container that loads content when visible
interface LazyContainerProps {
  children: ReactNode;
  fallback?: ReactNode;
  config?: Partial<LazyLoadConfig>;
  onVisible?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function LazyContainer({
  children,
  fallback,
  config = {},
  onVisible,
  className,
  style,
}: LazyContainerProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [ref, isIntersecting] = useIntersectionObserver(finalConfig);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasBeenVisible) {
      setHasBeenVisible(true);
      onVisible?.();
    }
  }, [isIntersecting, hasBeenVisible, onVisible]);

  const defaultFallback = (
    <div style={{ minHeight: '200px' }}>
      <Skeleton height={200} />
    </div>
  );

  return (
    <div ref={ref} className={className} style={style}>
      {hasBeenVisible ? children : (fallback || defaultFallback)}
    </div>
  );
}

// Lazy image component with progressive loading
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  config?: Partial<LazyLoadConfig>;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  style,
  onLoad,
  onError,
  config = {},
}: LazyImageProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [ref, isIntersecting] = useIntersectionObserver(finalConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isIntersecting) {
      setShouldLoad(true);
    }
  }, [isIntersecting]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={ref} className={className} style={style}>
      {shouldLoad && !hasError ? (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            ...style,
          }}
        />
      ) : hasError ? (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100px',
            ...style,
          }}
        >
          <Text size="sm" c="dimmed">Failed to load image</Text>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100px',
            ...style,
          }}
        >
          {!placeholder && (
            <Center style={{ height: '100%' }}>
              <Skeleton height="100%" width="100%" />
            </Center>
          )}
        </div>
      )}
    </div>
  );
}

// Lazy data loader hook
interface LazyDataConfig<T> {
  loader: () => Promise<T>;
  dependencies?: any[];
  config?: Partial<LazyLoadConfig>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useLazyData<T>({
  loader,
  dependencies = [],
  config = {},
  onSuccess,
  onError,
}: LazyDataConfig<T>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);

      // Auto-retry on failure
      if (retryCount < finalConfig.retryAttempts!) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, finalConfig.retryDelay! * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [loader, onSuccess, onError, retryCount, finalConfig.retryAttempts, finalConfig.retryDelay]);

  useEffect(() => {
    loadData();
  }, [...dependencies, retryCount]);

  const retry = useCallback(() => {
    setRetryCount(0);
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    retry,
    retryCount,
    canRetry: retryCount < finalConfig.retryAttempts!,
  };
}

// Preloader for intelligent preloading
export const preloader = {
  // Preload a component
  preloadComponent: async (componentId: string, loader: () => Promise<{ default: ComponentType<any> }>) => {
    if (componentCache.has(componentId) || preloadQueue.has(componentId)) {
      return;
    }

    preloadQueue.add(componentId);

    try {
      const module = await loader();
      componentCache.set(componentId, module.default);
    } catch (error) {
      console.warn(`Failed to preload component ${componentId}:`, error);
    } finally {
      preloadQueue.delete(componentId);
    }
  },

  // Preload an image
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Preload multiple resources
  preloadResources: async (resources: Array<{ type: 'component' | 'image'; id: string; loader?: any }>) => {
    const promises = resources.map(resource => {
      switch (resource.type) {
        case 'component':
          return preloader.preloadComponent(resource.id, resource.loader);
        case 'image':
          return preloader.preloadImage(resource.id);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Some resources failed to preload:', error);
    }
  },

  // Clear cache
  clearCache: () => {
    componentCache.clear();
    preloadQueue.clear();
  },

  // Get cache stats
  getCacheStats: () => ({
    componentsCached: componentCache.size,
    componentsPreloading: preloadQueue.size,
  }),
};

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  componentId: string,
  loader: () => Promise<{ default: ComponentType<P> }>,
  config?: Partial<LazyLoadConfig>
) {
  return function LazyWrapper(props: P) {
    return (
      <LazyComponent
        componentId={componentId}
        loader={loader}
        config={config}
        props={props}
      />
    );
  };
}

// Utility for creating lazy routes
export function createLazyRoute(
  routeId: string,
  loader: () => Promise<{ default: ComponentType<any> }>
) {
  return withLazyLoading(routeId, loader, {
    enablePreloading: true,
    cacheComponents: true,
  });
}
