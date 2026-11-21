import {toast} from '@badnpm/ui';
import 'dockview/dist/styles/dockview.css';
import {useState} from 'react';
import {
  DockviewApi,
  DockviewDidDropEvent,
  DockviewReact,
  type DockviewReadyEvent,
  positionToDirection,
  type SerializedDockview,
  themeDark,
  themeLight,
} from 'dockview';
import {PanelTypeComponent} from './components/panels';
import {PanelType, TabType} from './types';
import {useTheme} from '@/hooks/use-theme';
import Action from './action';
import {TabTypeComponent} from './components/tabs';
import {dragMimeTYpe} from './components/draggable-element';
import {addPanel, getNextId} from './tool';
import LeftAction from './components/left-header';
import RightAction from './components/right-header';
import PrefixHeader from './components/prefix-header';
import Watermark from './components/watermark';

export default function DockViewPage() {
  const {resolvedTheme: theme = 'light'} = useTheme();
  const [api, setApi] = useState<DockviewApi | null>(null);
  const [layout, setLayout] = useState<SerializedDockview | null>(null);

  const loadDefaultLayout = (api: DockviewApi) => {
    // 默认按照添加顺序从左到右
    const firstId = getNextId().toString();
    addPanel(api, {
      id: firstId,
      component: PanelType.common,
      tabComponent: TabType.common,
      params: {
        key: 'value',
      },
    });
    addPanel(api, {
      component: PanelType.common,
      tabComponent: TabType.common,

      position: {
        direction: 'right',
        referencePanel: firstId,
      },
      params: {
        key: 'value',
      },
    });
    addPanel(api, {
      component: PanelType.common,
    });
    addPanel(api, {
      component: PanelType.common,
      position: {
        direction: 'below',
        // 默认参照前面所有的面板
        // referencePanel: firstId
      },
    });
    addPanel(api, {
      component: PanelType.common,
    });
  };

  const handleOnReady = (event: DockviewReadyEvent) => {
    setApi(event.api);
    loadDefaultLayout(event.api);
    // 可以在onDidAddPanel、onDidRemovePanel、onDidActivePanelChange、onDidLayoutChange等回调中保存layout
    setLayout(event.api.toJSON());
  };

  // 从外部拖拽元素放置dock
  const handleDrop = (event: DockviewDidDropEvent) => {
    const originData = event.nativeEvent.dataTransfer?.getData(dragMimeTYpe);
    const data = JSON.parse(originData || '{}');
    const exists = event.api.getPanel(data.id || 'x-drag-id');
    if (exists) {
      toast.add({title: 'dock 中已存在该元素', type: 'info'});
      return;
    }
    event.api.addPanel({
      id: data.id || 'x-drag-id',
      component: PanelType.common,
      position: {
        direction: positionToDirection(event.position),
        referenceGroup: event.group || undefined,
      },
    });
  };

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <DockviewReact
          className="border-color-[var(--dv-separator-border)] border"
          // todo：跟随系统
          theme={theme === 'dark' ? themeDark : themeLight}
          components={PanelTypeComponent}
          tabComponents={TabTypeComponent}
          watermarkComponent={Watermark}
          prefixHeaderActionsComponent={PrefixHeader}
          leftHeaderActionsComponent={LeftAction}
          rightHeaderActionsComponent={RightAction}
          // locked // 没作用
          dndEdges={{
            // 落位指示器的大小，当你把面板放在边缘时，Dockview 预备分给你的这个新区域的宽度是多少。
            size: {value: 100, type: 'pixels'},
            // 触发灵敏度，鼠标指针需要距离边缘多近，Dockview 才会意识到你想要靠边放置，而不是放在中间（覆盖整个组）
            activationSize: {value: 5, type: 'percentage'},
          }}
          onReady={handleOnReady}
          onDidDrop={handleDrop}
        />
      </div>
      <div className="w-80 shrink-0 border px-4 py-2">
        <Action api={api} layout={layout} setLayout={setLayout} />
      </div>
    </div>
  );
}
