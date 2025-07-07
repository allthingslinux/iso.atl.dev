import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

// Performance monitoring for production
export function reportWebVitals(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    // Log to console in development for debugging
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
  
  // In production, you could send this to an analytics service
  // Example: send to Google Analytics, Vercel Analytics, or custom endpoint
  
  // For now, we'll use a simple logging approach
  if (typeof window !== 'undefined') {
    // Store metrics in sessionStorage for debugging
    const metrics = JSON.parse(sessionStorage.getItem('webVitals') || '[]');
    metrics.push({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      id: metric.id,
    });
    
    // Keep only last 20 metrics
    if (metrics.length > 20) {
      metrics.splice(0, metrics.length - 20);
    }
    
    sessionStorage.setItem('webVitals', JSON.stringify(metrics));
    
    // Send to custom analytics endpoint if available
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }
  }
}

// Initialize web vitals monitoring
export function initWebVitals() {
  if (typeof window !== 'undefined') {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
    onINP(reportWebVitals);
  }
}

// Get current performance metrics
export function getPerformanceMetrics() {
  if (typeof window === 'undefined') return null;
  
  const metrics = JSON.parse(sessionStorage.getItem('webVitals') || '[]');
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  // Type assertion for memory API that may not be available in all browsers
  interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }
  
  const memoryAPI = (performance as typeof performance & { memory?: PerformanceMemory })?.memory;
  
  return {
    webVitals: metrics,
    navigation: navigation ? {
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
    } : null,
    memory: memoryAPI ? {
      used: memoryAPI.usedJSHeapSize,
      total: memoryAPI.totalJSHeapSize,
      limit: memoryAPI.jsHeapSizeLimit,
    } : null,
  };
}

// Performance utility for measuring custom metrics
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

// Async performance measurement
export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Async Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Async Performance Error] ${name}: ${(end - start).toFixed(2)}ms`, error);
    }
    
    throw error;
  }
} 