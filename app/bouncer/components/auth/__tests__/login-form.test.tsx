import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'
import { signIn } from '@/lib/auth-client'

// Mock the auth client
jest.mock('@/lib/auth-client', () => ({
  signIn: {
    passkey: jest.fn(),
  },
}))

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.location = mockLocation as any
    // Reset PublicKeyCredential mock
    ;(global as any).PublicKeyCredential = class MockPublicKeyCredential {
      static isUserVerifyingPlatformAuthenticatorAvailable() {
        return Promise.resolve(true)
      }
    }
  })

  describe('Rendering', () => {
    it('renders the sign in heading', () => {
      render(<LoginForm />)
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('renders the passkey sign in button', () => {
      render(<LoginForm />)
      expect(screen.getByRole('button', { name: /sign in with passkey/i })).toBeInTheDocument()
    })

    it('renders the description text', () => {
      render(<LoginForm />)
      expect(
        screen.getByText(/Use your device's biometric authentication/i)
      ).toBeInTheDocument()
    })

    it('renders the sign up link', () => {
      render(<LoginForm />)
      const signUpLink = screen.getByRole('link', { name: /sign up/i })
      expect(signUpLink).toBeInTheDocument()
      expect(signUpLink).toHaveAttribute('href', '/auth/registration')
    })
  })

  describe('Browser Compatibility', () => {
    it('shows warning when passkeys are not supported', () => {
      // Remove PublicKeyCredential from window to simulate unsupported browser
      const originalPublicKeyCredential = (window as any).PublicKeyCredential
      delete (window as any).PublicKeyCredential

      render(<LoginForm />)
      expect(
        screen.getByText(/Your browser does not support passkeys/i)
      ).toBeInTheDocument()

      // Restore for other tests
      ;(window as any).PublicKeyCredential = originalPublicKeyCredential
    })

    it('disables button when passkeys are not supported', () => {
      const originalPublicKeyCredential = (window as any).PublicKeyCredential
      delete (window as any).PublicKeyCredential

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      expect(button).toBeDisabled()

      // Restore for other tests
      ;(window as any).PublicKeyCredential = originalPublicKeyCredential
    })

    it('enables button when passkeys are supported', () => {
      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Successful Sign In', () => {
    it('calls signIn.passkey with correct parameters', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      expect(mockSignIn).toHaveBeenCalledWith(
        {
          callbackURL: '/invitations',
        },
        expect.objectContaining({
          onRequest: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    it('redirects to invitations on successful sign in', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onSuccessCallback: () => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onSuccessCallback = callbacks.onSuccess
        return Promise.resolve({ data: { user: {} } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      // Simulate successful callback
      await waitFor(() => {
        if (onSuccessCallback!) {
          onSuccessCallback()
        }
      })

      await waitFor(() => {
        expect(window.location.href).toBe('/invitations')
      })
    })

    it('shows loading state during sign in', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let resolvePromise: (value: any) => void

      mockSignIn.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/Signing in with passkey/i)).toBeInTheDocument()
      })

      // Resolve the promise
      resolvePromise!({ data: { user: {} } })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when sign in fails', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'Test error' } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      // Simulate error callback
      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'Test error' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })
    })

    it('displays user-friendly message for cancelled sign in', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'NotAllowedError: cancelled' } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'NotAllowedError: cancelled' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText(/Sign in was cancelled/i)).toBeInTheDocument()
      })
    })

    it('displays message for unsupported browser error', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'NotSupportedError' } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
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

    it('displays message for no passkey found error', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'InvalidStateError' } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      await waitFor(() => {
        if (onErrorCallback!) {
          onErrorCallback({ error: { message: 'InvalidStateError' } })
        }
      })

      await waitFor(() => {
        expect(screen.getByText(/No passkey found/i)).toBeInTheDocument()
      })
    })

    it('displays generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock

      mockSignIn.mockRejectedValue(new Error('Network error'))

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(
          screen.getByText(/An unexpected error occurred/i)
        ).toBeInTheDocument()
      })
    })

    it('handles error from result.error', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock

      mockSignIn.mockResolvedValue({
        error: { message: 'Failed to authenticate' },
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to authenticate')).toBeInTheDocument()
      })
    })
  })

  describe('Button States', () => {
    it('disables button while loading', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let resolvePromise: (value: any) => void

      mockSignIn.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      resolvePromise!({ data: { user: {} } })
    })

    it('re-enables button after error', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.passkey as jest.Mock
      let onErrorCallback: (ctx: any) => void

      mockSignIn.mockImplementation((params, callbacks) => {
        onErrorCallback = callbacks.onError
        return Promise.resolve({ error: { message: 'Test error' } })
      })

      render(<LoginForm />)
      const button = screen.getByRole('button', { name: /sign in with passkey/i })
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
})

