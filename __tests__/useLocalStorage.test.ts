import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const KEY = 'test_key';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('useLocalStorage', () => {
  test('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 'default'));
    expect(result.current[0]).toBe('default');
  });

  test('returns stored value when localStorage has data', () => {
    localStorage.setItem(KEY, JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage(KEY, 'default'));
    // useEffect runs after mount — wait for it
    act(() => {});
    expect(result.current[0]).toBe('stored');
  });

  test('works with object values from localStorage', () => {
    const stored = { count: 42 };
    localStorage.setItem(KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useLocalStorage(KEY, { count: 0 }));
    act(() => {});
    expect(result.current[0]).toEqual({ count: 42 });
  });

  test('setValue updates state and writes to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 'initial'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem(KEY)!)).toBe('updated');
  });

  test('setValue with function updater receives previous value and updates correctly', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 10));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    expect(result.current[0]).toBe(15);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toBe(15);
  });

  test('falls back to initial value when localStorage contains corrupt JSON', () => {
    localStorage.setItem(KEY, 'not-valid-json{{{');
    const spy = jest.spyOn(Storage.prototype, 'getItem');
    spy.mockReturnValue('not-valid-json{{{');
    const { result } = renderHook(() => useLocalStorage(KEY, 'fallback'));
    act(() => {});
    expect(result.current[0]).toBe('fallback');
  });
});
