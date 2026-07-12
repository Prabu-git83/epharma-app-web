import { describe, it, expect } from 'vitest'
import { getNextOrderStatus, isValidOrderStatusTransition } from './orders'

describe('getNextOrderStatus', () => {
  it('returns the next forward status', () => {
    expect(getNextOrderStatus('placed')).toBe('confirmed')
    expect(getNextOrderStatus('confirmed')).toBe('dispensed')
    expect(getNextOrderStatus('dispensed')).toBe('shipped')
    expect(getNextOrderStatus('shipped')).toBe('delivered')
  })

  it('returns null once delivered', () => {
    expect(getNextOrderStatus('delivered')).toBeNull()
  })

  it('returns null for cancelled (not part of the forward sequence)', () => {
    expect(getNextOrderStatus('cancelled')).toBeNull()
  })
})

describe('isValidOrderStatusTransition', () => {
  it('allows the single next forward step', () => {
    expect(isValidOrderStatusTransition('placed', 'confirmed')).toBe(true)
    expect(isValidOrderStatusTransition('confirmed', 'dispensed')).toBe(true)
  })

  it('rejects forward-skipping', () => {
    expect(isValidOrderStatusTransition('placed', 'shipped')).toBe(false)
    expect(isValidOrderStatusTransition('placed', 'delivered')).toBe(false)
  })

  it('rejects a no-op transition', () => {
    expect(isValidOrderStatusTransition('placed', 'placed')).toBe(false)
  })

  it('allows cancellation from any non-terminal state', () => {
    expect(isValidOrderStatusTransition('placed', 'cancelled')).toBe(true)
    expect(isValidOrderStatusTransition('confirmed', 'cancelled')).toBe(true)
    expect(isValidOrderStatusTransition('dispensed', 'cancelled')).toBe(true)
    expect(isValidOrderStatusTransition('shipped', 'cancelled')).toBe(true)
  })

  it('rejects any transition once delivered', () => {
    expect(isValidOrderStatusTransition('delivered', 'cancelled')).toBe(false)
    expect(isValidOrderStatusTransition('delivered', 'confirmed')).toBe(false)
  })

  it('rejects any transition once cancelled', () => {
    expect(isValidOrderStatusTransition('cancelled', 'placed')).toBe(false)
    expect(isValidOrderStatusTransition('cancelled', 'confirmed')).toBe(false)
  })

  it('rejects backward transitions', () => {
    expect(isValidOrderStatusTransition('shipped', 'confirmed')).toBe(false)
  })
})
