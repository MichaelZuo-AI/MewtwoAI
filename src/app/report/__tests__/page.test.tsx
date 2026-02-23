import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportPage from '../page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    getParentReport: jest.fn(),
    getLearningProfile: jest.fn(),
    getCharacterFacts: jest.fn().mockReturnValue([]),
    saveParentReport: jest.fn(),
  },
}));

import { storage } from '@/lib/storage';

describe('ReportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('shows empty state when no report and no learning data', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue(null);
    (storage.getLearningProfile as jest.Mock).mockReturnValue(null);

    render(<ReportPage />);
    expect(screen.getByText('还没有学习数据')).toBeInTheDocument();
    expect(screen.getByText('和角色聊几次天后再来看报告吧！')).toBeInTheDocument();
  });

  it('renders cached report', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## 📚 词汇进展\n很棒！');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({ vocabulary: [{ word: 'cat' }], sessions: [] });

    render(<ReportPage />);
    expect(screen.getByText('很棒！')).toBeInTheDocument();
  });

  it('renders markdown headers', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Test Header');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({ vocabulary: [{ word: 'cat' }], sessions: [] });

    render(<ReportPage />);
    const header = screen.getByText('Test Header');
    expect(header.tagName).toBe('H2');
  });

  it('renders markdown list items', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('- Item one\n- Item two');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({ vocabulary: [{ word: 'cat' }], sessions: [] });

    render(<ReportPage />);
    expect(screen.getByText('Item one')).toBeInTheDocument();
    expect(screen.getByText('Item two')).toBeInTheDocument();
  });

  it('has a back button that navigates to /', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue(null);
    (storage.getLearningProfile as jest.Mock).mockReturnValue(null);

    render(<ReportPage />);
    fireEvent.click(screen.getByLabelText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows Regenerate button when learning data exists', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });

    render(<ReportPage />);
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('does not show Regenerate button when no learning data', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue(null);
    (storage.getLearningProfile as jest.Mock).mockReturnValue(null);

    render(<ReportPage />);
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
  });

  it('calls API on regenerate', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Old Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: '## New Report' }),
    });

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parent-report', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(storage.saveParentReport).toHaveBeenCalledWith('## New Report');
    });
  });

  it('renders h1 headers', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('# Main Title');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({ vocabulary: [{ word: 'cat' }], sessions: [] });

    render(<ReportPage />);
    const header = screen.getByText('Main Title');
    expect(header.tagName).toBe('H1');
  });

  it('shows "Generating report..." when report is null but learning data exists', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue(null);
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [],
    });

    render(<ReportPage />);
    expect(screen.getByText('Generating report...')).toBeInTheDocument();
  });

  it('renders plain text line as paragraph', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('This is plain text');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({ vocabulary: [{ word: 'cat' }], sessions: [] });

    render(<ReportPage />);
    const para = screen.getByText('This is plain text');
    expect(para.tagName).toBe('P');
  });

  it('disables Regenerate button while regenerating', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Old Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });

    let resolveRequest: (value: any) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(resolve => { resolveRequest = resolve; })
    );

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByText('Generating...')).toBeDisabled();
    });

    resolveRequest!({ ok: true, json: () => Promise.resolve({ report: '## New' }) });
  });

  it('keeps existing report when API response is not ok on regenerate', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Existing Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'server error' }),
    });

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });

    // Report is unchanged
    expect(screen.getByText('Existing Report')).toBeInTheDocument();
    expect(storage.saveParentReport).not.toHaveBeenCalled();
  });

  it('sends X-App-Source header on regenerate', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: '## New' }),
    });

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['X-App-Source']).toBe('ai-dream-buddies');
    });
  });

  it('does not call API on regenerate when no learning data', () => {
    (storage.getParentReport as jest.Mock).mockReturnValue(null);
    (storage.getLearningProfile as jest.Mock).mockReturnValue(null);

    render(<ReportPage />);
    // Regenerate button should not even exist when no data
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps existing report when API call throws on regenerate', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Original');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('updates displayed report after successful regeneration', async () => {
    (storage.getParentReport as jest.Mock).mockReturnValue('## Old Report');
    (storage.getLearningProfile as jest.Mock).mockReturnValue({
      vocabulary: [{ word: 'cat' }],
      sessions: [{ id: 's1' }],
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ report: '## New Report' }),
    });

    render(<ReportPage />);
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(screen.getByText('New Report')).toBeInTheDocument();
    });
  });
});
