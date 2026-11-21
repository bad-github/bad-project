import {type AddPanelOptions, DockviewApi} from 'dockview';
import {type MyAddPanelOptions} from './types';

let nextId = 1;
export const separator = '-';
export const iconClass = 'cursor-pointer hover:bg-(--dv-icon-hover-background-color) p-1 rounded-[2px]';

export function getNextId() {
  return nextId++;
}

export function addPanel(api: DockviewApi, options: MyAddPanelOptions) {
  const defaultId = getNextId().toString();
  const {id = defaultId, ...rest} = options;

  return api.addPanel({
    id,
    title: `Panel${separator}${id}`,
    ...rest,
  } as AddPanelOptions);
}
