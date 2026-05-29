import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';

describe('Avatar', () => {
  it('renders fallback when no image', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('renders image when src provided', () => {
    render(
      <Avatar>
        <AvatarImage src="/x.png" alt="User" />
        <AvatarFallback>X</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByRole('img', { name: 'User' })).toHaveAttribute(
      'src',
      '/x.png'
    );
  });
});
