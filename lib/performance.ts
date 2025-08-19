/**
 * Performance Monitoring and Optimization System for ThinkSpace
 * 
 * Provides comprehensive performance tracking, optimization suggestions,
 * and automatic performance improvements.
 */

import React , { useState, useEffect } from "react";

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'api' | 'render' | 'search' | 'cache' | 'database' | 'network';
  metadata?: any;
}

// Performance threshold configuration
interface PerformanceThresholds {
  apiResponseTime: number; // milliseconds
  renderTime: number; // milliseconds
  searchTime: number; // milliseconds
  cacheHitRate: number; // percentage
  memoryUsage: number; // MB
  bundleSize: number; // KB
}

// Performance optimization suggestion
interface OptimizationSuggestion {
  id: string;
  type: 'cache' | 'lazy-load' | 'bundle-split' | 'database' | 'api';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
}

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  apiResponseTime: 2000, // 2 seconds
  renderTime: 100, // 100ms
  searchTime: 1000, // 1 second
  cacheHitRate: 80, // 80%
  memoryUsage: 100, // 100MB
  bundleSize: 500, // 500KB
};

// Performance Monitor
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initializeObservers();
  }

  // Initialize performance observers
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Navigation timing observer
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page_load_time',
              value: navEntry.loadEventEnd - navEntry.startTime,
              timestamp: Date.now(),
              category: 'render' as const,
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
                firstPaint: navEntry.responseEnd - navEntry.startTime,
              },
            });
          }
        }
      });

      // Resource timing observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric({
              name: 'resource_load_time',
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              timestamp: Date.now(),
              category: 'network' as const,
              metadata: {
                name: resourceEntry.name,
                size: resourceEntry.transferSize,
                type: this.getResourceType(resourceEntry.name),
              },
            });
          }
        }
      });

      // Measure observer for custom metrics
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              category: this.getCategoryFromMeasureName(entry.name),
            });
          }
        }
      });

      // Start observing
      navObserver.observe({ entryTypes: ['navigation'] });
      resourceObserver.observe({ entryTypes: ['resource'] });
      measureObserver.observe({ entryTypes: ['measure'] });

      this.observers = [navObserver, resourceObserver, measureObserver];
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  // Start monitoring
  startMonitoring(): void {
    this.isMonitoring = true;
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for threshold violations
    this.checkThresholds(metric);
  }

  // Measure API call performance
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        timestamp: Date.now(),
        category: 'api' as const,
        metadata: { success: true },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        timestamp: Date.now(),
        category: 'api' as const,
        metadata: { success: false, error: error instanceof Error ? error.message : String(error) },
      });
      
      throw error;
    }
  }

  // Measure render performance
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    
    renderFn();
    
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      name: `render_${componentName}`,
      value: duration,
      timestamp: Date.now(),
      category: 'render' as const,
    });
  }

  // Measure search performance
  async measureSearch<T>(
    query: string,
    searchFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await searchFn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: 'search_query',
        value: duration,
        timestamp: Date.now(),
        category: 'search' as const,
        metadata: { 
          query: query.substring(0, 50), // Truncate for privacy
          queryLength: query.length,
        },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: 'search_query',
        value: duration,
        timestamp: Date.now(),
        category: 'search' as const,
        metadata: {
          query: query.substring(0, 50),
          queryLength: query.length,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      
      throw error;
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    averages: Record<string, number>;
    violations: PerformanceMetric[];
    suggestions: OptimizationSuggestion[];
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000); // Last 5 minutes

    // Calculate averages by category
    const averages: Record<string, number> = {};
    const categories = ['api', 'render', 'search', 'cache', 'database', 'network'];
    
    categories.forEach(category => {
      const categoryMetrics = recentMetrics.filter(m => m.category === category);
      if (categoryMetrics.length > 0) {
        averages[category] = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
      }
    });

    // Find threshold violations
    const violations = recentMetrics.filter(metric => this.isThresholdViolation(metric));

    // Generate optimization suggestions
    const suggestions = this.generateOptimizationSuggestions(averages, violations);

    return { averages, violations, suggestions };
  }

  // Monitor memory usage
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    setInterval(() => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric({
          name: 'memory_usage',
          value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
          timestamp: Date.now(),
          category: 'render' as const,
          metadata: {
            totalHeapSize: memory.totalJSHeapSize / 1024 / 1024,
            heapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024,
          },
        });
      }
    }, 30000); // Every 30 seconds
  }

  // Monitor Core Web Vitals
  private monitorCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'first_contentful_paint',
            value: entry.startTime,
            timestamp: Date.now(),
            category: 'render' as const,
          });
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        name: 'largest_contentful_paint',
        value: lastEntry.startTime,
        timestamp: Date.now(),
        category: 'render' as const,
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      this.recordMetric({
        name: 'cumulative_layout_shift',
        value: clsValue,
        timestamp: Date.now(),
        category: 'render' as const,
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Check if metric violates thresholds
  private isThresholdViolation(metric: PerformanceMetric): boolean {
    switch (metric.name) {
      case 'api_response_time':
        return metric.value > this.thresholds.apiResponseTime;
      case 'render_time':
        return metric.value > this.thresholds.renderTime;
      case 'search_query':
        return metric.value > this.thresholds.searchTime;
      case 'memory_usage':
        return metric.value > this.thresholds.memoryUsage;
      default:
        return false;
    }
  }

  // Check thresholds and emit warnings
  private checkThresholds(metric: PerformanceMetric): void {
    if (this.isThresholdViolation(metric)) {
      console.warn(`Performance threshold violation: ${metric.name} = ${metric.value}ms`);
      
      // Emit custom event for UI to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('performance-warning', {
          detail: { metric }
        }));
      }
    }
  }

  // Generate optimization suggestions
  private generateOptimizationSuggestions(
    averages: Record<string, number>,
    violations: PerformanceMetric[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // API performance suggestions
    if (averages.api > this.thresholds.apiResponseTime) {
      suggestions.push({
        id: 'api-caching',
        type: 'cache',
        priority: 'high',
        title: 'Implement API Response Caching',
        description: 'API responses are taking longer than expected. Implement caching to improve performance.',
        impact: 'Reduce API response time by 60-80%',
        implementation: 'Add cache headers and implement client-side caching',
        estimatedImprovement: `${Math.round((averages.api - this.thresholds.apiResponseTime) * 0.7)}ms faster`,
      });
    }

    // Render performance suggestions
    if (averages.render > this.thresholds.renderTime) {
      suggestions.push({
        id: 'lazy-loading',
        type: 'lazy-load',
        priority: 'medium',
        title: 'Implement Lazy Loading',
        description: 'Components are taking too long to render. Consider lazy loading non-critical components.',
        impact: 'Improve initial page load time',
        implementation: 'Use React.lazy() and Suspense for code splitting',
        estimatedImprovement: '30-50% faster initial load',
      });
    }

    // Search performance suggestions
    if (averages.search > this.thresholds.searchTime) {
      suggestions.push({
        id: 'search-optimization',
        type: 'database',
        priority: 'high',
        title: 'Optimize Search Queries',
        description: 'Search queries are slow. Consider adding database indexes or implementing search caching.',
        impact: 'Faster search results and better user experience',
        implementation: 'Add database indexes and implement search result caching',
        estimatedImprovement: `${Math.round((averages.search - this.thresholds.searchTime) * 0.8)}ms faster`,
      });
    }

    // Memory usage suggestions
    if (averages.render && this.metrics.some(m => m.name === 'memory_usage' && m.value > this.thresholds.memoryUsage)) {
      suggestions.push({
        id: 'memory-optimization',
        type: 'bundle-split',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is high. Consider code splitting and removing unused dependencies.',
        impact: 'Reduce memory footprint and improve performance',
        implementation: 'Analyze bundle size and implement code splitting',
        estimatedImprovement: '20-40% reduction in memory usage',
      });
    }

    return suggestions;
  }

  // Utility methods
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private getCategoryFromMeasureName(name: string): PerformanceMetric['category'] {
    if (name.startsWith('api_')) return 'api';
    if (name.startsWith('render_')) return 'render';
    if (name.startsWith('search_')) return 'search';
    if (name.startsWith('cache_')) return 'cache';
    if (name.startsWith('db_')) return 'database';
    return 'render';
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      timestamp: Date.now(),
    }, null, 2);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [summary, setSummary] = useState<ReturnType<typeof performanceMonitor.getPerformanceSummary> | null>(null);

  useEffect(() => {
    performanceMonitor.startMonitoring();

    const updateSummary = () => {
      setSummary(performanceMonitor.getPerformanceSummary());
    };

    // Update summary every 30 seconds
    const interval = setInterval(updateSummary, 30000);
    
    // Initial update
    updateSummary();

    return () => {
      clearInterval(interval);
      performanceMonitor.stopMonitoring();
    };
  }, []);

  return summary;
}

// Performance measurement decorators/utilities
export const performanceUtils = {
  // Measure component render time
  measureComponent: (componentName: string) => {
    return function <T extends React.ComponentType<any>>(Component: T): T {
      const MeasuredComponent = (props: any) => {
        useEffect(() => {
          const startTime = performance.now();
          
          return () => {
            const duration = performance.now() - startTime;
            performanceMonitor.recordMetric({
              name: `component_${componentName}`,
              value: duration,
              timestamp: Date.now(),
              category: 'render' as const,
            });
          };
        }, []);

        return React.createElement(Component, props);
      };

      MeasuredComponent.displayName = `Measured(${componentName})`;
      return MeasuredComponent as T;
    };
  },

  // Measure async function performance
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureApiCall(name, fn);
  },

  // Measure sync function performance
  measureSync: <T>(name: string, fn: () => T): T => {
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category: 'render' as const,
    });
    
    return result;
  },
};
