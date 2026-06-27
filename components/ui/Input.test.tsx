import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('associates the label with the field', () => {
    render(<Input label="Email address" />)
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  })

  it('shows an error message and hides the hint when error is set', () => {
    render(<Input label="Email" hint="We never share it" error="Invalid email" />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument()
  })

  it('shows the hint when there is no error', () => {
    render(<Input label="Email" hint="We never share it" />)
    expect(screen.getByText('We never share it')).toBeInTheDocument()
  })

  it('accepts typed input', async () => {
    render(<Input label="Email" />)
    const field = screen.getByLabelText('Email')
    await userEvent.type(field, 'jane@example.com')
    expect(field).toHaveValue('jane@example.com')
  })
})
