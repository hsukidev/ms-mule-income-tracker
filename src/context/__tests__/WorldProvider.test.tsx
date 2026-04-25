import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldProvider, useWorld } from '../WorldProvider';

function WorldConsumer() {
  const { world, setWorld } = useWorld();
  return (
    <div>
      <span data-testid="world-id">{world?.id ?? 'null'}</span>
      <span data-testid="world-label">{world?.label ?? 'none'}</span>
      <span data-testid="world-group">{world?.group ?? 'none'}</span>
      <button data-testid="set-kronos" onClick={() => setWorld('heroic-kronos')}>
        Set Kronos
      </button>
      <button data-testid="set-bera" onClick={() => setWorld('interactive-bera')}>
        Set Bera
      </button>
    </div>
  );
}

describe('WorldProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with null when nothing is stored', () => {
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('null');
    expect(screen.getByTestId('world-label').textContent).toBe('none');
  });

  it('initializes from a valid localStorage id', () => {
    localStorage.setItem('world', 'heroic-hyperion');
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('heroic-hyperion');
    expect(screen.getByTestId('world-label').textContent).toBe('Hyperion');
    expect(screen.getByTestId('world-group').textContent).toBe('Heroic');
  });

  it('falls back to null when the stored id is unknown', () => {
    localStorage.setItem('world', 'not-a-world');
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('null');
    expect(screen.getByTestId('world-label').textContent).toBe('none');
  });

  it('falls back to null when the stored value is an empty string', () => {
    localStorage.setItem('world', '');
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('null');
  });

  it('setWorld updates the current world', () => {
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    fireEvent.click(screen.getByTestId('set-kronos'));
    expect(screen.getByTestId('world-id').textContent).toBe('heroic-kronos');
    expect(screen.getByTestId('world-label').textContent).toBe('Kronos');
    expect(screen.getByTestId('world-group').textContent).toBe('Heroic');
  });

  it('setWorld persists the id to localStorage under the "world" key', () => {
    render(
      <WorldProvider>
        <WorldConsumer />
      </WorldProvider>,
    );
    fireEvent.click(screen.getByTestId('set-bera'));
    expect(localStorage.getItem('world')).toBe('interactive-bera');
  });

  it('defaultWorld prop overrides the localStorage read', () => {
    localStorage.setItem('world', 'heroic-kronos');
    render(
      <WorldProvider defaultWorld="interactive-scania">
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('interactive-scania');
    expect(screen.getByTestId('world-label').textContent).toBe('Scania');
  });

  it('defaultWorld={null} overrides a valid stored value with null', () => {
    localStorage.setItem('world', 'heroic-kronos');
    render(
      <WorldProvider defaultWorld={null}>
        <WorldConsumer />
      </WorldProvider>,
    );
    expect(screen.getByTestId('world-id').textContent).toBe('null');
  });

  it('throws when useWorld is used outside a WorldProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<WorldConsumer />)).toThrow();
    spy.mockRestore();
  });
});
