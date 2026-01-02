import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '../register-form'
import { emailOtp, signIn, passkey } from '@/lib/auth-client'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the auth client
jest.mock('@/lib/auth-client', () => ({
  emailOtp: {
    sendVerificationOtp: jest.fn(),
  },
  signIn: {
    emailOtp: jest.fn(),
  },
  passkey: {
    addPasskey: jest.fn(),
  },
}))

describe('RegisterForm', () =>  {
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

  describe('Initial Render (Email Step)', () => {
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

    it('renders the send verification code button', () => {
      render(<RegisterForm />)
      expect(
        screen.getByRole('button', { name: /send verification code/i })
      ).toBeInTheDocument()
    })

    it('renders the description text', () => {
      render(<RegisterForm />)
      expect(
        screen.getByText(/We'll send a verification code/i)
      ).toBeInTheDocument()
    })

    it('renders the sign in link', () => {
      render(<RegisterForm />)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('Email Step - Form Validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup()
      const { container } = render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email/i)
      
      await user.clear(nameInput)
      await user.type(emailInput, 'test@example.com')

      nameInput.removeAttribute('required')
      
      const form = container.querySelector('form') as HTMLFormElement
      await act(async () => {
        form.requestSubmit()
      })

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      const { container } = render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement

      await user.type(nameInput, 'Test User')
      await user.clear(emailInput)

      emailInput.removeAttribute('required')
      
      const form = container.querySelector('form') as HTMLFormElement
      await act(async () => {
        form.requestSubmit()
      })

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('does not call sendVerificationOtp when validation fails', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock

      render(<RegisterForm />)
      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSendOtp).not.toHaveBeenCalled()
      })
    })
  })

  describe('Email Step - Sending OTP', () => {
    it('calls sendVerificationOtp with email and type', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ data: { success: true } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith({
          email: 'john@example.com',
          type: 'sign-in',
        })
      })
    })

    it('trims whitespace from name and email', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ data: { success: true } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, '  John Doe  ')
      await user.type(emailInput, '  john@example.com  ')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith({
          email: 'john@example.com', // Should be trimmed
          type: 'sign-in',
        })
      })
    })

    it('shows loading state while sending OTP', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      let resolvePromise: (value: any) => void

      mockSendOtp.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Sending verification code/i)).toBeInTheDocument()
      })

      resolvePromise!({ data: { success: true } })
    })

    it('transitions to OTP step on successful OTP send', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ data: { success: true } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/We've sent a verification code/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })
    })

    it('displays error when OTP send fails', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ error: { message: 'Failed to send code' } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to send code')).toBeInTheDocument()
      })
    })
  })

  describe('OTP Step - Verification', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ data: { success: true } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })
    })

    it('renders OTP input field', () => {
      const otpInput = screen.getByLabelText(/verification code/i)
      expect(otpInput).toBeInTheDocument()
      expect(otpInput).toHaveAttribute('placeholder', '000000')
      expect(otpInput).toHaveAttribute('maxLength', '6')
    })

    it('only allows numeric input in OTP field', async () => {
      const user = userEvent.setup()
      const otpInput = screen.getByLabelText(/verification code/i) as HTMLInputElement

      await user.type(otpInput, 'abc123def456')

      expect(otpInput.value).toBe('123456')
    })

    it('limits OTP input to 6 digits', async () => {
      const user = userEvent.setup()
      const otpInput = screen.getByLabelText(/verification code/i) as HTMLInputElement

      await user.type(otpInput, '1234567890')

      expect(otpInput.value).toBe('123456')
    })

    it('validates OTP is not empty before submission', () => {
      // This test is in the OTP Step describe block, so OTP step is already set up by beforeEach
      // Button should be disabled when OTP is empty - this validates the empty check
      const verifyButtons = screen.getAllByRole('button', { name: /verify code/i })
      // Get the first one (the verify button, not resend)
      const verifyButton = verifyButtons.find(btn => !btn.textContent?.includes('Resend')) || verifyButtons[0]
      expect(verifyButton).toBeDisabled()
      
      // The validation happens in the component - if OTP is empty, button is disabled
      // This prevents form submission, which is the desired behavior
    })

    it('calls signIn.emailOtp with email and OTP', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.emailOtp as jest.Mock
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const button = screen.getByRole('button', { name: /verify code/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'john@example.com',
          otp: '123456',
        })
      })
    })

    it('trims OTP before verification', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.emailOtp as jest.Mock
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '  123456  ')

      const button = screen.getByRole('button', { name: /verify code/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'john@example.com',
          otp: '123456', // Should be trimmed
        })
      })
    })

    it('disables verify button when OTP is less than 6 digits', () => {
      const verifyButton = screen.getByRole('button', { name: /verify code/i })
      expect(verifyButton).toBeDisabled()
    })

    it('enables verify button when OTP is 6 digits', async () => {
      const user = userEvent.setup()
      const otpInput = screen.getByLabelText(/verification code/i)

      await user.type(otpInput, '123456')

      const verifyButton = screen.getByRole('button', { name: /verify code/i })
      expect(verifyButton).not.toBeDisabled()
    })

    it('transitions to passkey step on successful verification', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.emailOtp as jest.Mock
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const button = screen.getByRole('button', { name: /verify code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Email verified!/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create passkey/i })).toBeInTheDocument()
      })
    })

    it('displays error for invalid OTP', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.emailOtp as jest.Mock
      // Use error message that includes "invalid" to trigger the user-friendly message
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid verification code' } })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const button = screen.getByRole('button', { name: /verify code/i })
      await user.click(button)

      await waitFor(() => {
        // The error message should be shown (either the user-friendly one or the raw one)
        expect(screen.getByText(/Invalid verification code/i)).toBeInTheDocument()
      })
    })

    it('displays error for expired OTP', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn.emailOtp as jest.Mock
      mockSignIn.mockResolvedValue({ error: { message: 'OTP expired' } })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const button = screen.getByRole('button', { name: /verify code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Invalid or expired verification code/i)).toBeInTheDocument()
      })
    })

    it('allows resending OTP', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockResolvedValue({ data: { success: true } })

      const resendButton = screen.getByRole('button', { name: /resend code/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledTimes(2) // Once initially, once on resend
      })
    })
  })

  describe('Passkey Step - Creation', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      const mockSignIn = signIn.emailOtp as jest.Mock
      
      mockSendOtp.mockResolvedValue({ data: { success: true } })
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const sendButton = screen.getByRole('button', { name: /send verification code/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const verifyButton = screen.getByRole('button', { name: /verify code/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Email verified!/i)).toBeInTheDocument()
      })
    })

    it('renders passkey creation step', () => {
      expect(screen.getByText(/Email verified!/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create passkey/i })).toBeInTheDocument()
      expect(screen.getByText(/You'll be prompted to create a passkey/i)).toBeInTheDocument()
    })

    it('calls passkey.addPasskey with name', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ data: { passkey: {} } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockAddPasskey).toHaveBeenCalledWith({
          name: "John Doe's Passkey",
        })
      })
    })

    it('redirects to invitations on successful passkey creation', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ data: { passkey: {} } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invitations')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('displays error when passkey creation fails', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ error: { message: 'Failed to create passkey' } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to create passkey')).toBeInTheDocument()
      })
    })

    it('displays user-friendly message for cancelled passkey creation', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ error: { message: 'NotAllowedError: cancelled' } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Passkey creation was cancelled/i)).toBeInTheDocument()
      })
    })

    it('displays message for unsupported browser error', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ error: { message: 'NotSupportedError' } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Passkeys are not supported in this browser/i)).toBeInTheDocument()
      })
    })

    it('displays message for existing passkey error', async () => {
      const user = userEvent.setup()
      const mockAddPasskey = passkey.addPasskey as jest.Mock
      mockAddPasskey.mockResolvedValue({ error: { message: 'InvalidStateError' } })

      const button = screen.getByRole('button', { name: /create passkey/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/A passkey already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Browser Compatibility', () => {
    it('shows warning when passkeys are not supported in passkey step', async () => {
      const user = userEvent.setup()
      const originalPublicKeyCredential = (window as any).PublicKeyCredential
      delete (window as any).PublicKeyCredential

      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      const mockSignIn = signIn.emailOtp as jest.Mock
      
      mockSendOtp.mockResolvedValue({ data: { success: true } })
      mockSignIn.mockResolvedValue({ data: { user: {} } })

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const sendButton = screen.getByRole('button', { name: /send verification code/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '123456')

      const verifyButton = screen.getByRole('button', { name: /verify code/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Your browser does not support passkeys/i)).toBeInTheDocument()
      })

      // Restore for other tests
      ;(window as any).PublicKeyCredential = originalPublicKeyCredential
    })
  })

  describe('Error Handling', () => {
    it('displays generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      const mockSendOtp = emailOtp.sendVerificationOtp as jest.Mock
      mockSendOtp.mockRejectedValue(new Error('Network error'))

      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      const button = screen.getByRole('button', { name: /send verification code/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument()
      })
    })
  })
})
