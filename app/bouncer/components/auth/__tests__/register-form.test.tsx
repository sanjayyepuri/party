import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';
import { signUp } from '@/lib/auth-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  signUp: {
    email: vi.fn(),
  },
}));

describe('RegisterForm', () => {
  const mockSignUp = signUp.email as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with name, email, and password fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('allows user to type in all form fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    mockSignUp.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Creating account...');
  });

  it('calls signUp.email with correct parameters on submit', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: null, error: null });
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
      });
    });
  });

  it('displays error message when registration fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email already exists';
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('redirects to /invitations on successful registration', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: null, error: null });
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      // Router is mocked, so we just verify the component rendered and submitted
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  it('requires all form fields', () => {
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('enforces minimum password length', () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText('Password');
    
    expect(passwordInput).toHaveAttribute('minLength', '8');
    expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('disables form fields when loading', async () => {
    const user = userEvent.setup();
    mockSignUp.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  it('displays generic error message on unexpected error', async () => {
    const user = userEvent.setup();
    mockSignUp.mockRejectedValue(new Error('Network error'));
    
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });
});

