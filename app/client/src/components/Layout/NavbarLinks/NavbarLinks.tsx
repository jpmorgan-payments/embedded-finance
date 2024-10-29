import { Link, LinkProps, useMatch, useResolvedPath } from 'react-router-dom';
import { UnstyledButton } from '@mantine/core';
import {
  IconCreditCard,
  IconHelp,
  IconExchange,
  IconUserPlus,
  IconZoomMoney,
  IconHome,
  IconUsers,
  IconLock,
} from '@tabler/icons';

import useStyles from './NavbarLinks.styles';

const ebLinks = [
  { link: 'login', label: 'Authentication', icon: IconLock },
  { link: 'overview', label: 'Overview', icon: IconHome },
  { link: 'onboarding', label: 'Onboarding Clients', icon: IconUserPlus },
  { link: 'accounts', label: 'Managing Accounts', icon: IconZoomMoney },
  { link: 'recipients', label: 'Managing Recipients', icon: IconUsers },
  { link: 'transactions', label: 'Moving Money', icon: IconExchange },
  { link: 'debit-cards', label: 'Managing Debit Cards', icon: IconCreditCard },
  { link: 'cases', label: 'Getting Support', icon: IconHelp },
];

const epLinks = [
  { link: 'ep/onboarding', label: 'Onboarding', icon: IconUserPlus },
  { link: 'ep/onboarding-basic', label: 'Onboarding Basic', icon: IconUserPlus },
  { link: 'ep/linked-accounts', label: 'Linked Accounts', icon: IconUsers },
];

const NavbarLink = ({ children, to, ...props }: LinkProps) => {
  const { classes, cx } = useStyles();
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname });
  const childMatch = useMatch({ path: resolved.pathname + '/:child' });

  return (
    <UnstyledButton<typeof Link>
      component={Link}
      className={cx(classes.link, {
        [classes.linkActive]: match || childMatch,
      })}
      to={to}
      {...props}
    >
      {children}
    </UnstyledButton>
  );
};

type NavbarLinksProps = {
  product: 'EB' | 'EP';
};

export const NavbarLinks = ({ product }: NavbarLinksProps) => {
  const { classes } = useStyles();

  return (
    <>
      {(product === 'EB' ? ebLinks : epLinks).map((item) => (
        <NavbarLink to={item.link} key={item.label}>
          <item.icon className={classes.linkIcon} />
          <span>{item.label}</span>
        </NavbarLink>
      ))}
    </>
  );
};
