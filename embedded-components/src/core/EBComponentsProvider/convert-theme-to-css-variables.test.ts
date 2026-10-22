import { convertThemeToCssString } from './convert-theme-to-css-variables';

describe('convertThemeToCssString', () => {
  it('emits legitimate string token values', () => {
    const css = convertThemeToCssString({
      variables: {
        contentFontFamily: '"Open Sans", sans-serif',
        borderRadius: 'calc(0.5rem - 2px)',
      },
    });

    expect(css).toContain('--eb-font-family: "Open Sans", sans-serif;');
    expect(css).toContain('--eb-radius: calc(0.5rem - 2px);');
  });

  it.each([
    ['style element breakout', 'x}</style><img src=x onerror=alert(1)>'],
    ['rule breakout', '0}body{background:url(https://evil.example)}'],
    ['declaration breakout', 'Arial;--eb-radius:99px'],
    ['comment injection', 'Arial/*'],
    ['escape sequence', 'Arial\\'],
  ])('drops values attempting %s', (_, payload) => {
    const css = convertThemeToCssString({
      variables: { contentFontFamily: payload, borderRadius: payload },
    });

    expect(css).not.toContain(payload);
    expect(css).not.toMatch(/<|>/);
    expect(css.match(/\{/g)).toHaveLength(3);
    expect(css.match(/\}/g)).toHaveLength(3);
  });
});
