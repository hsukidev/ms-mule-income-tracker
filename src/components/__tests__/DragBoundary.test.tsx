import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DragBoundary } from '../DragBoundary'

describe('DragBoundary', () => {
  it('renders children', () => {
    render(
      <DragBoundary isDragging={false}>
        <div>child content</div>
      </DragBoundary>,
    )
    expect(screen.getByText('child content')).toBeTruthy()
  })

  it('does not show dotted border when not dragging', () => {
    const { container } = render(
      <DragBoundary isDragging={false}>
        <div>child</div>
      </DragBoundary>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderStyle).toBe('')
  })

  it('shows dotted border with dimmed color when dragging', () => {
    const { container } = render(
      <DragBoundary isDragging={true}>
        <div>child</div>
      </DragBoundary>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderStyle).toBe('dotted')
    expect(wrapper.style.borderWidth).toBe('2px')
    expect(wrapper.style.borderColor).toContain('var(--mantine-color-dimmed)')
  })

  it('removes border when dragging becomes false', () => {
    const { container, rerender } = render(
      <DragBoundary isDragging={true}>
        <div>child</div>
      </DragBoundary>,
    )
    let wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderStyle).toBe('dotted')

    rerender(
      <DragBoundary isDragging={false}>
        <div>child</div>
      </DragBoundary>,
    )
    wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderStyle).toBe('')
  })
})