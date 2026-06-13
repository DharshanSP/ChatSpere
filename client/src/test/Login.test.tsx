import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock the API module
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../services/socket', () => ({
  connectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: true })),
  disconnectSocket: vi.fn(),
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  it('should render login form', () => {
    renderLogin();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    renderLogin();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('should update email field on input', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    expect(emailInput).toHaveValue('test@test.com');
  });

  it('should update password field on input', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show loading state when submitting', async () => {
    const { authApi } = await import('../services/api');
    (authApi.login as any).mockReturnValue(new Promise(() => {})); // never resolves

    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitBtn = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('should show error message on failed login', async () => {
    const { authApi } = await import('../services/api');
    (authApi.login as any).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitBtn = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
