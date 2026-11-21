import {useTheme} from '@/hooks/use-theme';
import './index.css';

export default function ThemeSwitch() {
  const {resolvedTheme: theme = 'light', setTheme} = useTheme();
  if (!import.meta.env.DEV) return null;
  return (
    <div className="theme-switch-container">
      <button className="switch-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        <IconSun className="light-icon" />
        <IconMoon className="dark-icon" />
      </button>
    </div>
  );
}

const IconSun = ({style, className}: {style?: React.CSSProperties; className?: string}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
};

const IconMoon = ({style, className}: {style?: React.CSSProperties; className?: string}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
};
