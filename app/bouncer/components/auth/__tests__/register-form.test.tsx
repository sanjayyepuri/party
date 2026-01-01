import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '../register-form'
import { signUp } from '@/lib/auth-client'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the auth client
jest.mock('@/lib/auth-client', () => ({
  signUp: {
    passkey: jest.fn(),
  },
}))

describe('RegisterForm', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    // Reset PublicKeyCredential mock
    ;(global as any).PublicKeyCredential = class MockPublicKeyCredential {
      static isUserVerifyingPlatformAuthenticatorAvailable() {
        return Promise.resolve(true)
      }
    }
  })

  describe('Rendering', () => {
    it('renders the create account heading', () => {
      render(<RegisterForm />)
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('renders name input field', () => {
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/name/i)
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).toHaveAttribute('type', 'text')
    })

    it('renders email input field', () => {
      render(<RegisterForm />)
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('renders the passkey registration button', () => {
      render(<RegisterForm />)
      expect(
        screen.getByRole('button', { name: /create account with passkey/i })
      ).toBeInTheDocument()
    })

    it('renders the description text', () => {
      render(<RegisterForm />)
      expect(
        screen.getByText(/You'll be prompted to create a passkey/i)
      ).toBeInTheDocument()
    })

    it('renders the sign in link', () => {
      render(<RegisterForm />)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('Form Validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup()
      const { container } = render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email/i)
      
      // Clear name field and type email
      await user.clear(nameInput)
      await user.type(emailInput, 'test@example.com')

      // Remove required attribute to bypass HTML5 validation and test our custom validation
      nameInput.removeAttribute('required')
      
      const form = container.querySelector('form') as HTMLFormElement
      form.requestSubmit()

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      const { container } = render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement

      await user.type(nameInput, 'Test User')
      await user.clear(emailInput)

      // Remove required attribute to bypass HTML5 validation and test our custom validation
      emailInput.removeAttribute('required')
      
      const form = container.querySelector('form') as HTMLFormElement
      form.requestSubmit()

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('does not call signUp when validation fails', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock

      render(<RegisterForm />)
      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('Browser Compatibility', () => {
    it('shows warning when passkeys are not supported', () => {
      const originalPublicKeyCredential = (window as any).PublicKeyCredential
      delete (window as any).PublicKeyCredential

      render(<RegisterForm />)
      expect(
        screen.getByText(/Your browser does not support passkeys/i)
      ).toBeInTheDocument()

      // Restore for other tests
      ;(window as any).PublicKeyCredential = originalPublicKeyCredential
    })

    it('disables button when passkeys are not supported', () => {
      const originalPublicKeyCredential = (window as any).PublicKeyCredential
      delete (window as any).PublicKeyCredential

      render(<RegisterForm />)
      const button = screen.getByRole('button', { name: /create account with passkey/i })
      expect(button).toBeDisabled()

      // Restore for other tests
      ;(window as any).PublicKeyCredential = originalPublicKeyCredential
    })

    it('enables button when passkeys are supported', () => {
      render(<RegisterForm />)
      const button = screen.getByRole('button', { name: /create account with passkey/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Successful Registration', () => {
    it('calls signUp.passkey with name and email', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      mockSignUp.mockResolvedValue({ data: { user: {} } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          {
            name: 'John Doe',
            email: 'john@example.com',
            callbackURL: '/invitations',
          },
          expect.objectContaining({
            onRequest: expect.any(Function),
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        )
      })
    })

    it('redirects to invitations on successful registration', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onSuccessCallback: () => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onSuccessCallback = callbacks.onSuccess
        return Promise.resolve({ data: { user: {} } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onSuccessCallback!) {
          onSuccessCallback()
        }
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invitations')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('shows loading state during registration', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let resolvePromise: (value: any) => void

      mockSignUp.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Creating passkey/i)).toBeInTheDocument()
      })

      resolvePromise!({ data: { user: {} } })
    })

    it('trims whitespace from name and email', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      mockSignUp.mockResolvedValue({ data: { user: {} } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, '  John Doe  ')
      await user.type(emailInput, '  john@example.com  ')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe', // Values should be trimmed
            email: 'john@example.com', // Values should be trimmed
          }),
          expect.any(Object)
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when registration fails', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'Registration failed' } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'Registration failed' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument()
      })
    })

    it('displays user-friendly message for cancelled registration', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'NotAllowedError: cancelled' } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'NotAllowedError: cancelled' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText(/Passkey creation was cancelled/i)).toBeInTheDocument()
      })
    })

    it('displays message for unsupported browser error', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'NotSupportedError' } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'NotSupportedError' } })
        }
      })

      await waitFor(() => {
        expect(
          screen.getByText(/Passkeys are not supported in this browser/i)
        ).toBeInTheDocument()
      })
    })

    it('displays message for existing passkey error', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'InvalidStateError' } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'InvalidStateError' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText(/A passkey already exists/i)).toBeInTheDocument()
      })
    })

    it('displays generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock

      mockSignUp.mockRejectedValue(new Error('Network error'))

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(
          screen.getByText(/An unexpected error occurred/i)
        ).toBeInTheDocument()
      })
    })

    it('handles error from result.error', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock

      mockSignUp.mockResolvedValue({
        error: { message: 'Failed to create account' },
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to create account')).toBeInTheDocument()
      })
    })
  })

  describe('Button States', () => {
    it('disables button while loading', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let resolvePromise: (value: any) => void

      mockSignUp.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      resolvePromise!({ data: { user: {} } })
    })

    it('re-enables button after error', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignUp.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'Test error' } })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /create account with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'Test error' } })
        }
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Input Fields', () => {
    it('allows typing in name field', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      await user.type(nameInput, 'John Doe')

      expect(nameInput.value).toBe('John Doe')
    })

    it('allows typing in email field', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      await user.type(emailInput, 'john@example.com')

      expect(emailInput.value).toBe('john@example.com')
    })

    it('disables inputs while loading', async () => {
      const user = userEvent.setup()
      const mockSignUp = signUp.passkey as jest.Mock
      let resolvePromise: (value: any) => void

      mockSignUp.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /create account with passkey/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(button)

      await waitFor(() => {
        expect(nameInput).toBeDisabled()
        expect(emailInput).toBeDisabled()
      })

      resolvePromise!({ data: { user: {} } })
    })
  })
})

