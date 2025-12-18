import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

interface FooterProps {
  theme: ThemeOption;
}

export function Footer({ theme }: FooterProps) {
  const themeStyles = useThemeStyles(theme);

  return (
    <footer
      className={`mt-6 border-t py-4 ${themeStyles.getContentAreaStyles()}`}
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        {/* Disclaimer text */}
        <div
          className={`space-y-0.5 text-xs leading-tight ${themeStyles.getHeaderLabelStyles()}`}
        >
          <p>
            Deposit holding and other banking services are provided to you by
            J.P. Morgan Chase Bank, N.A., Member FDIC.
          </p>
          <p>
            SellSense administers and services the Account on behalf of the
            Bank. SellSense is not a bank.
          </p>
        </div>

        {/* Logo and powered by text */}
        <div className="mt-3 flex flex-col items-center gap-1.5">
          {themeStyles.getLogoPath() && (
            <img
              src={themeStyles.getLogoPath()}
              alt={themeStyles.getLogoAlt()}
              className={`${themeStyles.getLogoStyles()}`}
            />
          )}
          <p className={`text-xs ${themeStyles.getHeaderLabelStyles()}`}>
            Powered by J.P.Morgan
          </p>
        </div>
      </div>
    </footer>
  );
}
