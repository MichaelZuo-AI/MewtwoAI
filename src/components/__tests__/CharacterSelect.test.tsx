import { render, screen, fireEvent } from '@testing-library/react';
import CharacterSelect from '../CharacterSelect';
import { getAllCharacters } from '@/lib/characters';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    getLearningProfile: jest.fn(() => null),
    getCharacterFacts: jest.fn(() => []),
    saveParentReport: jest.fn(),
  },
}));

describe('CharacterSelect', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all characters', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    const characters = getAllCharacters();
    characters.forEach(char => {
      expect(screen.getByAltText(char.name)).toBeInTheDocument();
      expect(screen.getByText(char.name)).toBeInTheDocument();
    });
  });

  it('renders the heading', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    expect(screen.getByText('Who do you want to talk to?')).toBeInTheDocument();
  });

  it('calls onSelect with mewtwo id when Mewtwo is clicked', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByLabelText('Talk to Mewtwo'));
    expect(mockOnSelect).toHaveBeenCalledWith('mewtwo');
  });

  it('calls onSelect with kirby id when Kirby is clicked', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByLabelText('Talk to Kirby'));
    expect(mockOnSelect).toHaveBeenCalledWith('kirby');
  });

  it('renders character images', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    expect(screen.getByAltText('Mewtwo')).toBeInTheDocument();
    expect(screen.getByAltText('Kirby')).toBeInTheDocument();
  });

  it('applies character accent glow to portraits', () => {
    const { container } = render(<CharacterSelect onSelect={mockOnSelect} />);
    const portraits = container.querySelectorAll('.rounded-full.overflow-hidden');
    expect(portraits.length).toBeGreaterThanOrEqual(2);
  });

  it('uses dark background', () => {
    const { container } = render(<CharacterSelect onSelect={mockOnSelect} />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('bg-gray-950');
  });

  it('calls onSelect with correct id for each character', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    const characters = getAllCharacters();
    characters.forEach(char => {
      fireEvent.click(screen.getByLabelText(`Talk to ${char.name}`));
      expect(mockOnSelect).toHaveBeenCalledWith(char.id);
    });
    expect(mockOnSelect).toHaveBeenCalledTimes(characters.length);
  });

  it('renders a ParentReportButton', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    // ParentReportButton renders a button with aria-label "Learning report"
    expect(screen.getByRole('button', { name: 'Learning report' })).toBeInTheDocument();
  });

  it('renders a grid layout for characters', () => {
    const { container } = render(<CharacterSelect onSelect={mockOnSelect} />);
    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  it('each character button has aria-label', () => {
    render(<CharacterSelect onSelect={mockOnSelect} />);
    const characters = getAllCharacters();
    characters.forEach(char => {
      const btn = screen.getByLabelText(`Talk to ${char.name}`);
      expect(btn).toBeInTheDocument();
    });
  });
});
