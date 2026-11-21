export type MobileMenuVariant = 'panel' | 'popover';

export type MenuSurfaceProps = {
  id: string;
  open: boolean;
  pathname: string;
  onNavigate: () => void;
  onDismiss: () => void;
};
