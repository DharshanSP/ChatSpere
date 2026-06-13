import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';

vi.mock('../services/api', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock('../services/socket', () => ({
  connectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: true })),
  disconnectSocket: vi.fn(),
}));

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  it('should render registration form', () => {
    renderRegister();
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('should render link to login page', () => {
    renderRegister();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
  });

  it('should update form fields on input', () => {
    renderRegister();
    const displayNameInput = screen.getByPlaceholderText('John Doe');
    const usernameInput = screen.getByPlaceholderText('johndoe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 6 characters');

    fireEvent.change(displayNameInput, { target: { value: 'New User' } });
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(displayNameInput).toHaveValue('New User');
    expect(usernameInput).toHaveValue('newuser');
    expect(emailInput).toHaveValue('new@test.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show error on failed registration', async () => {
    const { authApi } = await import('../services/api');
    (authApi.register as any).mockRejectedValue({
      response: { data: { message: 'User already exists' } },
    });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    const { authApi } = await import('../services/api');
    (authApi.register as any).mockReturnValue(new Promise(() => {}));

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Create Account'));

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
  });
});
