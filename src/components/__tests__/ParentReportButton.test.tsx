import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParentReportButton from '../ParentReportButton';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    getLearningProfile: jest.fn(),
    getCharacterFacts: jest.fn().mockReturnValue([]),
    saveParentReport: jest.fn(),
  },
}));

import { storage } from '@/lib/storage';

describe('ParentReportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('renders the button', () => {
    render(<ParentReportButton />);
    expect(screen.getByRole('button', { name: 'Learning report' })).toBeInTheDocument();
  });

  it('navigates to /report when no learning data', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue(null);
    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));
    expect(mockPush).toHaveBeenCalledWith('/report');
  });

  it('navigates to /report when learning data has empty vocabulary and sessions', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1,
    });
    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));
    expect(mockPush).toHaveBeenCalledWith('/report');
  });

  it('calls API and navigates when learning data exists', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
      currentFocus: [],
      lastUpdated: 1,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: 'Great progress!' }),
    });

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parent-report', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(storage.saveParentReport).toHaveBeenCalledWith('Great progress!');
      expect(mockPush).toHaveBeenCalledWith('/report');
    });
  });

  it('navigates even when API fails', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
      currentFocus: [],
      lastUpdated: 1,
    });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/report');
    });
  });

  it('sends X-App-Source header', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
      currentFocus: [],
      lastUpdated: 1,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: 'Report' }),
    });

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['X-App-Source']).toBe('ai-dream-buddies');
    });
  });

  it('shows loading spinner while fetching', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
      currentFocus: [],
      lastUpdated: 1,
    });

    let resolveRequest: (value: any) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(resolve => { resolveRequest = resolve; })
    );

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      // While loading, the button should be disabled
      expect(screen.getByRole('button', { name: 'Learning report' })).toBeDisabled();
    });

    // Resolve so the hook cleans up
    resolveRequest!({ ok: true, json: () => Promise.resolve({ report: 'r' }) });
  });

  it('navigates to /report when API response is not ok', async () => {
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
      currentFocus: [],
      lastUpdated: 1,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'error' }),
    });

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/report');
    });
    // saveParentReport should NOT be called since response is not ok
    expect(storage.saveParentReport).not.toHaveBeenCalled();
  });

  it('sends vocabulary and sessions in fetch body', async () => {
    const vocab = [{ word: 'cat', status: 'mastered', correctUses: 5, struggles: 0 }];
    const sessions = [{ id: 's1', date: '2026-01-01' }];
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: vocab,
      sessions,
      currentFocus: [],
      lastUpdated: 1,
    });
    (storage.getCharacterFacts as jest.Mock).mockReturnValue(['Damian loves skiing']);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: 'Done' }),
    });

    render(<ParentReportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning report' }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.vocabulary).toEqual(vocab);
      expect(body.sessions).toEqual(sessions);
      expect(body.facts).toEqual(['Damian loves skiing']);
    });
  });
});
