import type {IWatermarkPanelProps} from 'dockview';
import {addPanel} from '../tool';
import {PanelType} from '../types';
import {Button} from '@badnpm/ui';

export default function Watermark(props: IWatermarkPanelProps) {
  const isGroup = props.containerApi.groups.length > 0;
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col gap-2">
        {isGroup && <Button>close group</Button>}
        <Button
          onClick={() => {
            addPanel(props.containerApi, {component: PanelType.common});
          }}
        >
          add panel
        </Button>
      </div>
    </div>
  );
}
