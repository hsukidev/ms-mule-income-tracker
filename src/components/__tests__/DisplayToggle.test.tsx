import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisplayProvider } from '../../context/DisplayProvider';
import { DisplayToggle } from '../DisplayToggle';

function segment(value: 'cards' | 'list'): HTMLButtonElement {
  return screen
    .getByTestId('display-toggle')
    .querySelector(`[data-value="${value}"]`) as HTMLButtonElement;
}

describe('DisplayToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-display');
  });

  it('renders two segment buttons', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    expect(segment('cards')).toBeTruthy();
    expect(segment('list')).toBeTruthy();
  });

  it('marks the cards segment as pressed by default', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    expect(segment('cards').getAttribute('aria-pressed')).toBe('true');
    expect(segment('list').getAttribute('aria-pressed')).toBe('false');
  });

  it('flips display when the active (cards) segment is clicked', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    fireEvent.click(segment('cards'));
    expect(document.documentElement.getAttribute('data-display')).toBe('list');
    expect(segment('list').getAttribute('aria-pressed')).toBe('true');
    expect(segment('cards').getAttribute('aria-pressed')).toBe('false');
  });

  it('flips display when the inactive (list) segment is clicked', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    fireEvent.click(segment('list'));
    expect(document.documentElement.getAttribute('data-display')).toBe('list');
  });

  it('flips back on a second click', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    fireEvent.click(segment('list'));
    fireEvent.click(segment('list'));
    expect(document.documentElement.getAttribute('data-display')).toBe('cards');
  });

  it('aria-label always describes the next display mode', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    expect(segment('cards').getAttribute('aria-label')).toBe('Switch to list view');
    expect(segment('list').getAttribute('aria-label')).toBe('Switch to list view');
    fireEvent.click(segment('cards'));
    expect(segment('cards').getAttribute('aria-label')).toBe('Switch to cards view');
    expect(segment('list').getAttribute('aria-label')).toBe('Switch to cards view');
  });

  it('exposes display-toggle test id and data-display attribute on the container', () => {
    render(
      <DisplayProvider>
        <DisplayToggle />
      </DisplayProvider>,
    );
    const toggle = screen.getByTestId('display-toggle');
    expect(toggle.getAttribute('data-display')).toBe('cards');
  });
});
