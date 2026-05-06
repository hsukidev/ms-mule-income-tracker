import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisplayProvider, useDisplay } from '../DisplayProvider';

function TestComponent() {
  const { display, setDisplay } = useDisplay();
  return (
    <div>
      <span data-testid="display">{display}</span>
      <button onClick={() => setDisplay(display === 'cards' ? 'list' : 'cards')}>toggle</button>
    </div>
  );
}

describe('DisplayProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-display');
  });

  it('defaults to cards', () => {
    render(
      <DisplayProvider>
        <TestComponent />
      </DisplayProvider>,
    );
    expect(screen.getByTestId('display').textContent).toBe('cards');
  });

  it('applies data-display attribute to html element', () => {
    render(
      <DisplayProvider>
        <TestComponent />
      </DisplayProvider>,
    );
    expect(document.documentElement.getAttribute('data-display')).toBe('cards');
  });

  it('flips to list when setDisplay is called', () => {
    render(
      <DisplayProvider>
        <TestComponent />
      </DisplayProvider>,
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('display').textContent).toBe('list');
    expect(document.documentElement.getAttribute('data-display')).toBe('list');
  });

  it('persists display to localStorage under key `display`', () => {
    render(
      <DisplayProvider>
        <TestComponent />
      </DisplayProvider>,
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(localStorage.getItem('display')).toBe('list');
  });

  it('reads initial display from localStorage', () => {
    localStorage.setItem('display', 'list');
    render(
      <DisplayProvider>
        <TestComponent />
      </DisplayProvider>,
    );
    expect(screen.getByTestId('display').textContent).toBe('list');
  });
});
