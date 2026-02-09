import { render, screen, fireEvent } from '@testing-library/react';
import SettingsMenu from '../SettingsMenu';

describe('SettingsMenu', () => {
  const defaultProps = {
    onClearHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the gear button', () => {
      render(<SettingsMenu {...defaultProps} />);
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('does not show dropdown initially', () => {
      render(<SettingsMenu {...defaultProps} />);
      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('opens dropdown on click', () => {
      render(<SettingsMenu {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Settings'));
      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });

    it('closes dropdown on second click', () => {
      render(<SettingsMenu {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Settings'));
      expect(screen.getByText('Clear History')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Settings'));
      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });
  });

  describe('clear history', () => {
    it('fires onClearHistory and closes when clicking Clear History', () => {
      const onClearHistory = jest.fn();
      render(<SettingsMenu {...defaultProps} onClearHistory={onClearHistory} />);

      fireEvent.click(screen.getByLabelText('Settings'));
      fireEvent.click(screen.getByText('Clear History'));

      expect(onClearHistory).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });
  });

  describe('outside click', () => {
    it('closes when clicking outside the menu', () => {
      render(
        <div>
          <SettingsMenu {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      fireEvent.click(screen.getByLabelText('Settings'));
      expect(screen.getByText('Clear History')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });

    it('does not close when clicking inside the menu', () => {
      render(<SettingsMenu {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Settings'));
      fireEvent.mouseDown(screen.getByLabelText('Settings'));
      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });
  });

  describe('bgColor prop', () => {
    it('applies background style when bgColor is provided', () => {
      render(<SettingsMenu {...defaultProps} bgColor="#2d1b4e" />);
      fireEvent.click(screen.getByLabelText('Settings'));

      const dropdown = screen.getByText('Clear History').closest('.backdrop-blur-lg') as HTMLElement;
      // jsdom normalizes hex+alpha (#2d1b4ef2) to rgba
      expect(dropdown?.style.background).toContain('rgba');
    });

    it('does not apply background style when bgColor is not provided', () => {
      render(<SettingsMenu {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Settings'));

      const dropdown = screen.getByText('Clear History').closest('.backdrop-blur-lg') as HTMLElement;
      expect(dropdown?.style.background).toBe('');
    });
  });
});
