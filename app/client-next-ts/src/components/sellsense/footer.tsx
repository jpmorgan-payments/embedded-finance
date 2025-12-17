import { useThemeStyles } from './theme-utils'
import type { ThemeOption } from './use-sellsense-themes'

interface FooterProps {
  theme: ThemeOption
}

export function Footer({ theme }: FooterProps) {
  const themeStyles = useThemeStyles(theme)

  return (
    <footer
      className={`border-t mt-8 py-6 ${themeStyles.getContentAreaStyles()}`}
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Disclaimer text */}
        <div className={`text-xs leading-relaxed space-y-2 ${themeStyles.getHeaderLabelStyles()}`}>
          <p>
            Deposit holding and other banking services are provided to you by J.P. Morgan Chase Bank, N.A., Member FDIC.
          </p>
          <p>
            SellSense administers and services the Account on behalf of the Bank. SellSense is not a bank.
          </p>
        </div>

        {/* Logo and powered by text */}
        <div className="mt-4 flex flex-col items-center gap-2">
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
  )
}
