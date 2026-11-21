import {cn} from '@badnpm/ui';
import {useEffect, useState} from 'react';
import type {IDockviewPanelHeaderProps} from 'dockview';
import {X} from 'lucide-react';

type TParams = {
  key: string;
};
export default function CommonTab(props: IDockviewPanelHeaderProps<TParams>) {
  const {api} = props;
  const [active, setActive] = useState(api.isActive);

  useEffect(() => {
    const disposables = [
      api.onDidActiveChange((event) => {
        setActive(event.isActive);
      }),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api]);

  const onClose = (event: React.MouseEvent) => {
    event.stopPropagation(); // 防止触发 tab 切换
    api.close();
  };
  console.warn(props.containerApi.activePanel?.id, api.id);
  return (
    <div className="dv-default-tab">
      <div className={cn('dv-default-tab-content', active && 'text-green-500')}>{props.api.title} (custom)</div>
      <div className="dv-default-tab-action" onClick={onClose}>
        <X className="size-[11px] scale-150" />
      </div>
    </div>
  );
}
