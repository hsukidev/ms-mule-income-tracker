import { describe, expect, it } from 'vitest'
import { render } from '../../test/test-utils'
import { Button } from '../ui/button'

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

describe('Button', () => {
  it.each(VARIANTS)('variant "%s" has pointer cursor', (variant) => {
    const { container } = render(<Button variant={variant}>Click</Button>)
    const button = container.querySelector('button')!
    expect(button.className).toContain('cursor-pointer')
  })
})
