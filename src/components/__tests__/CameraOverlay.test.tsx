import { render, screen, fireEvent, act } from '@testing-library/react';
import CameraOverlay from '../CameraOverlay';

describe('CameraOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the overlay with all elements', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByTestId('camera-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('camera-overlay-capture')).toBeInTheDocument();
    expect(screen.getByTestId('camera-overlay-text')).toBeInTheDocument();
    expect(screen.getByTestId('camera-overlay-dismiss')).toBeInTheDocument();
  });

  it('displays "Tap to take a photo!" text', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('Tap to take a photo!')).toBeInTheDocument();
  });

  it('displays "Maybe later" dismiss link', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('Maybe later')).toBeInTheDocument();
  });

  it('calls onCapture when capture button is tapped', () => {
    const onCapture = jest.fn();
    render(<CameraOverlay onCapture={onCapture} onDismiss={jest.fn()} />);
    fireEvent.click(screen.getByTestId('camera-overlay-capture'));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when "Maybe later" is tapped', () => {
    const onDismiss = jest.fn();
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('camera-overlay-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 8 seconds by default', () => {
    const onDismiss = jest.fn();
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(8000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after custom autoHideMs', () => {
    const onDismiss = jest.fn();
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={onDismiss} autoHideMs={5000} />);

    act(() => { jest.advanceTimersByTime(4999); });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('clears auto-dismiss timer when capture is tapped', () => {
    const onDismiss = jest.fn();
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('camera-overlay-capture'));
    act(() => { jest.advanceTimersByTime(10000); });
    // onDismiss should NOT have been called by the timer
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has a large tap target (w-40 h-40)', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    const button = screen.getByTestId('camera-overlay-capture');
    expect(button.className).toContain('w-40');
    expect(button.className).toContain('h-40');
  });

  it('has accessible label on capture button', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByLabelText('Tap to take a photo')).toBeInTheDocument();
  });

  it('is a full-screen overlay (fixed inset-0 z-50)', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    const overlay = screen.getByTestId('camera-overlay');
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
    expect(overlay.className).toContain('z-50');
  });

  it('has semi-transparent background', () => {
    render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    const overlay = screen.getByTestId('camera-overlay');
    expect(overlay.className).toContain('bg-black/60');
  });

  it('renders SVG camera icon', () => {
    const { container } = render(<CameraOverlay onCapture={jest.fn()} onDismiss={jest.fn()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('clears timer on unmount', () => {
    const onDismiss = jest.fn();
    const { unmount } = render(<CameraOverlay onCapture={jest.fn()} onDismiss={onDismiss} />);
    unmount();
    act(() => { jest.advanceTimersByTime(10000); });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
