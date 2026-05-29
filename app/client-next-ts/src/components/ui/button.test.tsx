import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    let button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border', 'border-input', 'bg-background');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('h-8', 'px-3', 'text-xs');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('h-10', 'px-8');
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      'disabled:pointer-events-none',
      'disabled:opacity-50'
    );
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const button = screen.getByRole('button', { name: /clickable/i });

    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render as icon button', () => {
    render(
      <Button size="icon" aria-label="Close">
        ×
      </Button>
    );
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('h-9', 'w-9');
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref test</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('should handle all variant combinations', () => {
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const;
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        const { unmount } = render(
          <Button variant={variant} size={size}>
            {variant} {size}
          </Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });
});
