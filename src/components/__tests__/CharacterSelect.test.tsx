import { render, screen, fireEvent } from '@testing-library/react';
import CharacterSelect from '../CharacterSelect';
import { getAllCharacters } from '@/lib/characters';

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
});
