import {createContext, useContext, useState} from 'react';

type ConfigProviderProps = {
  children: React.ReactNode;
  defaultShowShortcut?: boolean;
  defaultShowText?: boolean;
  defaultHideWhenUnavailable?: boolean;
  defaultAutoOpenOnLinkActive?: boolean;
};

type ConfigProviderState = {
  hideWhenUnavailable: boolean;
  setHideWhenUnavailable: React.Dispatch<React.SetStateAction<boolean>>;
  showShortcut: boolean;
  setShowShortcut: React.Dispatch<React.SetStateAction<boolean>>;
  showText: boolean;
  setShowText: React.Dispatch<React.SetStateAction<boolean>>;
  autoOpenOnLinkActive: boolean;
  setAutoOpenOnLinkActive: React.Dispatch<React.SetStateAction<boolean>>;
};

const initialState: ConfigProviderState = {
  hideWhenUnavailable: false,
  showShortcut: false,
  showText: false,
  autoOpenOnLinkActive: false,
  setHideWhenUnavailable: () => null,
  setShowShortcut: () => null,
  setShowText: () => null,
  setAutoOpenOnLinkActive: () => null,
};

const ConfigContext = createContext<ConfigProviderState>(initialState);

export function ConfigProvider(props: ConfigProviderProps) {
  const {
    children,
    defaultShowShortcut = false,
    defaultShowText = false,
    defaultHideWhenUnavailable = false,
    defaultAutoOpenOnLinkActive = false,
    ...restProps
  } = props;
  const [hideWhenUnavailable, setHideWhenUnavailable] = useState<boolean>(defaultHideWhenUnavailable);
  const [showShortcut, setShowShortcut] = useState<boolean>(defaultShowShortcut);
  const [showText, setShowText] = useState<boolean>(defaultShowText);
  const [autoOpenOnLinkActive, setAutoOpenOnLinkActive] = useState<boolean>(defaultAutoOpenOnLinkActive);

  const value = {
    hideWhenUnavailable,
    setHideWhenUnavailable,
    showShortcut,
    setShowShortcut,
    showText,
    setShowText,
    autoOpenOnLinkActive,
    setAutoOpenOnLinkActive,
  };

  return (
    <ConfigContext.Provider {...restProps} value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};
