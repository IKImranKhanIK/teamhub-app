import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatTab from '../components/ChatTab';

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// ── Mocks ────────────────────────────────────────────────────

jest.mock('@/lib/storage', () => ({
  loadCrew: jest.fn(() => [
    { id: '1', name: 'Test User', role: 'Engineer', emoji: '🧑', funFact: '', status: 'available' },
  ]),
}));

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
}));

jest.mock('../components/Toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'spinner' }),
}));

// ── Helpers ──────────────────────────────────────────────────

function renderAndLoad() {
  jest.useFakeTimers();
  render(<ChatTab />);
  act(() => { jest.advanceTimersByTime(700); });
  jest.useRealTimers();
}

beforeEach(() => {
  localStorage.clear();
});

// ── Tests ────────────────────────────────────────────────────

describe('ChatTab', () => {
  test('renders without crashing and shows heading after loading', () => {
    renderAndLoad();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  test('shows loading spinner before 600ms has elapsed', () => {
    jest.useFakeTimers();
    render(<ChatTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(700); });
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('send button is disabled when message input is empty', () => {
    renderAndLoad();
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  test('send button is disabled when message exceeds 280 characters', () => {
    renderAndLoad();
    // Select a sender
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test User' } });
    const input = screen.getByPlaceholderText(/type a message/i);
    const longText = 'a'.repeat(281);
    fireEvent.change(input, { target: { value: longText } });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  test('submitting a valid message adds it to the message list', () => {
    renderAndLoad();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test User' } });
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Hello from test!' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(screen.getByText('Hello from test!')).toBeInTheDocument();
  });

  test('pressing Enter submits the message', () => {
    renderAndLoad();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test User' } });
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Enter key test' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(screen.getByText('Enter key test')).toBeInTheDocument();
  });

  test('input clears after message is submitted', () => {
    renderAndLoad();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test User' } });
    const input = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Typed message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(input.value).toBe('');
  });
});
