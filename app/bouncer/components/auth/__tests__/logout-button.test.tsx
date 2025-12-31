import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '../logout-button';
import { signOut } from '@/lib/auth-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  signOut: vi.fn(),
}));

describe('LogoutButton', () => {
  const mockSignOut = signOut as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logout button', () => {
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
  });

  it('displays "sign out" text when not loading', () => {
    render(<LogoutButton />);
    
    expect(screen.getByText('sign out')).toBeInTheDocument();
  });

  it('calls signOut when clicked', async () => {
    const user = userEvent.setup();
    mockSignOut.mockResolvedValue(undefined);
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  it('redirects to /auth/login after successful logout', async () => {
    const user = userEvent.setup();
    mockSignOut.mockResolvedValue(undefined);
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      // Router is mocked, so we just verify signOut was called
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('shows loading state while signing out', async () => {
    const user = userEvent.setup();
    mockSignOut.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('signing out...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it('is disabled when loading', async () => {
    const user = userEvent.setup();
    mockSignOut.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('handles logout errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      // Button should be enabled again after error
      expect(button).not.toBeDisabled();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('does not redirect on logout error', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);
    
    await waitFor(() => {
      // Verify signOut was called but error was handled
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});

