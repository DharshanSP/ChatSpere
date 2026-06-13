import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Avatar from '../components/Avatar';
import MessageBubble from '../components/MessageBubble';
import OnlineStatus from '../components/OnlineStatus';
import TypingIndicator from '../components/TypingIndicator';
import SearchBar from '../components/SearchBar';
import { mockMessage, mockUser, mockUser2, mockChat } from './mocks';

describe('Avatar', () => {
  it('should render initials from name when no image', () => {
    render(<Avatar name="Test User" src="" />);
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('should render single letter for single-word name', () => {
    render(<Avatar name="Alice" src="" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should show online indicator when online', () => {
    const { container } = render(<Avatar name="Test" src="" online={true} />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should not show online indicator when offline', () => {
    const { container } = render(<Avatar name="Test" src="" online={false} />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).not.toBeInTheDocument();
  });
});

describe('MessageBubble', () => {
  it('should render message content', () => {
    render(
      <BrowserRouter>
        <MessageBubble message={mockMessage} />
      </BrowserRouter>
    );
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('should show sender name for group messages', () => {
    render(
      <BrowserRouter>
        <MessageBubble message={mockMessage} showSender={true} senderName="Test User" />
      </BrowserRouter>
    );
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('should not show sender name when showSender is false', () => {
    render(
      <BrowserRouter>
        <MessageBubble message={mockMessage} showSender={false} senderName="Test User" />
      </BrowserRouter>
    );
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });
});

describe('OnlineStatus', () => {
  it('should show "Online" when user is online', () => {
    render(<OnlineStatus online={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show formatted last seen when offline with lastSeen', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    render(<OnlineStatus online={false} lastSeen={pastDate} />);
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('should show "Just now" for very recent lastSeen', () => {
    const now = new Date().toISOString();
    render(<OnlineStatus online={false} lastSeen={now} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should render empty when offline without lastSeen', () => {
    const { container } = render(<OnlineStatus online={false} />);
    expect(container.querySelector('span')).toHaveTextContent('');
  });
});

describe('TypingIndicator', () => {
  it('should render nothing when no users are typing', () => {
    const { container } = render(
      <TypingIndicator typingUsers={[]} userDisplayNames={{}} />
    );
    expect(container.textContent).toBe('');
  });

  it('should show single user typing', () => {
    render(
      <TypingIndicator
        typingUsers={['user-1']}
        userDisplayNames={{ 'user-1': 'Alice' }}
      />
    );
    expect(screen.getByText(/Alice is typing/)).toBeInTheDocument();
  });

  it('should show multiple users typing', () => {
    render(
      <TypingIndicator
        typingUsers={['user-1', 'user-2']}
        userDisplayNames={{ 'user-1': 'Alice', 'user-2': 'Bob' }}
      />
    );
    expect(screen.getByText(/Alice and Bob are typing/)).toBeInTheDocument();
  });
});

describe('SearchBar', () => {
  it('should render search input', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should display the current value', () => {
    render(<SearchBar value="test query" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new search' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
