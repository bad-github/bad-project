import type {AddPanelOptions} from 'dockview';

export const PanelType = {
  common: 'common',
} as const;
export type TPanelType = (typeof PanelType)[keyof typeof PanelType];

export const TabType = {
  common: 'common',
} as const;
export type TTabType = (typeof TabType)[keyof typeof TabType];

export type MyAddPanelOptions = Omit<AddPanelOptions, 'id'> & {
  id?: string;
  component: string;
};
