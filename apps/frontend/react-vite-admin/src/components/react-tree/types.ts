import type {ComponentType, SVGProps} from 'react';

export type ReactTreeNode = {
  id: string;
  name: string;
  children?: ReactTreeNode[];
  isReadonly?: boolean;
  isCreating?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};
