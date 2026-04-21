import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Controlled via module-level flag so we can flip it before React re-renders
let controlledThrow = true;
function MaybeThrow() {
  if (controlledThrow) throw new Error('Test render error');
  return <div>Rendered successfully</div>;
}

// Separate component for tests that just need to throw unconditionally.
// Return type must be explicit because TypeScript infers `void` for always-throwing functions.
function AlwaysThrows(): React.ReactElement {
  throw new Error('Test render error');
}

// Silence expected console.error output from React's error boundary logging
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    controlledThrow = true; // reset before each test
  });

  test('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  test('shows fallback UI when a child throws a render error', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong in this section.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  test('"Try again" button resets error state so children can render again', () => {
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong in this section.')).toBeInTheDocument();

    // Flip the flag BEFORE clicking Try again so the re-render succeeds
    controlledThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Rendered successfully')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong in this section.')).not.toBeInTheDocument();
  });

  test('console.error is called with the component name when an error is caught', () => {
    render(
      <ErrorBoundary name="TestTab">
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalled();
    // React also calls console.error for uncaught errors before componentDidCatch fires,
    // so we search all calls for the one containing the boundary name.
    const allArgs = (console.error as jest.Mock).mock.calls.flat();
    const match = allArgs.find((a): a is string => typeof a === 'string' && a.includes('TestTab'));
    expect(match).toBeTruthy();
  });
});
