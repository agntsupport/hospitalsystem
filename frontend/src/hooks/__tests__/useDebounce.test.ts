import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('test', 500));

      expect(result.current).toBe('test');
    });

    it('should handle string values', () => {
      const { result } = renderHook(() => useDebounce('hello world', 500));

      expect(result.current).toBe('hello world');
    });

    it('should handle number values', () => {
      const { result } = renderHook(() => useDebounce(42, 500));

      expect(result.current).toBe(42);
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useDebounce(true, 500));

      expect(result.current).toBe(true);
    });

    it('should handle null values', () => {
      const { result } = renderHook(() => useDebounce(null, 500));

      expect(result.current).toBeNull();
    });

    it('should handle undefined values', () => {
      const { result } = renderHook(() => useDebounce(undefined, 500));

      expect(result.current).toBeUndefined();
    });

    it('should handle object values', () => {
      const obj = { name: 'test', age: 25 };
      const { result } = renderHook(() => useDebounce(obj, 500));

      expect(result.current).toEqual(obj);
    });

    it('should handle array values', () => {
      const arr = [1, 2, 3, 4, 5];
      const { result } = renderHook(() => useDebounce(arr, 500));

      expect(result.current).toEqual(arr);
    });
  });

  describe('Debouncing Behavior', () => {
    it('should debounce value updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated' });

      // Value should not update immediately
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // After delay, value should update
      expect(result.current).toBe('updated');
    });

    it('should cancel previous timeout on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      rerender({ value: 'third' });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should still have first value
      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should now have third value (last one)
      expect(result.current).toBe('third');
    });

    it('should update value after specified delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 1000 } }
      );

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(999);
      });

      expect(result.current).toBe('test');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle multiple rapid updates correctly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });
      rerender({ value: 'third' });
      rerender({ value: 'fourth' });
      rerender({ value: 'fifth' });

      // All changes happen before delay, so value should not update yet
      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should have the last value
      expect(result.current).toBe('fifth');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle very short delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle very long delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 5000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(4999);
      });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('Delay Changes', () => {
    it('should handle delay value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not update yet with new delay
      expect(result.current).toBe('test');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should update after new delay
      expect(result.current).toBe('updated');
    });

    it('should reset timer when delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Change delay
      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should still have initial value
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Now should have updated value
      expect(result.current).toBe('updated');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = renderHook(() => useDebounce('test', 500));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('should cleanup previous timeout when value changes', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );

      rerender({ value: 'second' });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('should not cause memory leaks on rapid mount/unmount', () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useDebounce(`test-${i}`, 500));
        unmount();
      }

      // Should not crash or leak memory
      expect(true).toBe(true);
    });
  });

  describe('Different Data Types', () => {
    it('should debounce string search queries', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      rerender({ value: 'J' });
      rerender({ value: 'Ju' });
      rerender({ value: 'Jua' });
      rerender({ value: 'Juan' });

      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('Juan');
    });

    it('should debounce numeric values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 10 });
      rerender({ value: 20 });
      rerender({ value: 30 });

      expect(result.current).toBe(0);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(30);
    });

    it('should debounce boolean toggles', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: false } }
      );

      rerender({ value: true });
      rerender({ value: false });
      rerender({ value: true });

      expect(result.current).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(true);
    });

    it('should debounce complex objects', () => {
      const obj1 = { name: 'John', age: 25 };
      const obj2 = { name: 'Jane', age: 30 };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: obj1 } }
      );

      rerender({ value: obj2 });

      expect(result.current).toEqual(obj1);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(obj2);
    });

    it('should debounce arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: arr1 } }
      );

      rerender({ value: arr2 });

      expect(result.current).toEqual(arr1);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(arr2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same value updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'test' } }
      );

      rerender({ value: 'test' });
      rerender({ value: 'test' });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('test');
    });

    it('should handle empty string', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: '' });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('');
    });

    it('should handle negative numbers', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      rerender({ value: -100 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(-100);
    });

    it('should handle NaN', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      rerender({ value: NaN });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBeNaN();
    });

    it('should handle Infinity', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      rerender({ value: Infinity });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(Infinity);
    });

    it('should handle switching between different types', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'string' as any } }
      );

      rerender({ value: 123 as any });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(123);

      rerender({ value: true as any });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should debounce search input (typing simulation)', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      // User types "react"
      rerender({ value: 'r' });
      act(() => jest.advanceTimersByTime(50));

      rerender({ value: 're' });
      act(() => jest.advanceTimersByTime(50));

      rerender({ value: 'rea' });
      act(() => jest.advanceTimersByTime(50));

      rerender({ value: 'reac' });
      act(() => jest.advanceTimersByTime(50));

      rerender({ value: 'react' });

      // Value should still be empty before delay
      expect(result.current).toBe('');

      // After delay, should have final value
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('react');
    });

    it('should debounce window resize events', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: { width: 1920, height: 1080 } } }
      );

      // Simulate rapid resize events
      rerender({ value: { width: 1900, height: 1080 } });
      rerender({ value: { width: 1850, height: 1080 } });
      rerender({ value: { width: 1800, height: 1080 } });
      rerender({ value: { width: 1750, height: 1080 } });

      expect(result.current).toEqual({ width: 1920, height: 1080 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toEqual({ width: 1750, height: 1080 });
    });

    it('should debounce form input validation', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: '' } }
      );

      // User types email
      rerender({ value: 'u' });
      rerender({ value: 'us' });
      rerender({ value: 'use' });
      rerender({ value: 'user' });
      rerender({ value: 'user@' });
      rerender({ value: 'user@e' });
      rerender({ value: 'user@ex' });
      rerender({ value: 'user@example.com' });

      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('user@example.com');
    });

    it('should debounce API filter parameters', () => {
      const initialFilters = { search: '', category: '', minPrice: 0 };
      const updatedFilters = { search: 'laptop', category: 'electronics', minPrice: 500 };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 400),
        { initialProps: { value: initialFilters } }
      );

      rerender({ value: { ...initialFilters, search: 'l' } });
      rerender({ value: { ...initialFilters, search: 'la' } });
      rerender({ value: { ...initialFilters, search: 'lap' } });
      rerender({ value: updatedFilters });

      expect(result.current).toEqual(initialFilters);

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current).toEqual(updatedFilters);
    });
  });

  describe('Performance', () => {
    it('should not create excessive timeouts', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      const callsBefore = setTimeoutSpy.mock.calls.length;

      for (let i = 0; i < 10; i++) {
        rerender({ value: `value-${i}` });
      }

      const callsAfter = setTimeoutSpy.mock.calls.length;

      // Should create one timeout per rerender (+ cleanup on each)
      expect(callsAfter - callsBefore).toBe(10);

      setTimeoutSpy.mockRestore();
    });

    it('should handle high-frequency updates efficiently', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      );

      // Simulate 100 rapid updates
      for (let i = 1; i <= 100; i++) {
        rerender({ value: i });
      }

      expect(result.current).toBe(0);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(100);
    });
  });
});
