import React, {useEffect, useState} from 'react';
import {DockviewApi, type SerializedDockview} from 'dockview';
import DraggableElement, {dragMimeTYpe} from './components/draggable-element';
import DroppableElement, {dropMimeType} from './components/droppable-element';
import {addPanel} from './tool';
import {PanelType} from './types';
import {Button, Label, Checkbox} from '@badnpm/ui';

type TProps = {
  api: DockviewApi | null;
  layout: SerializedDockview | null;
  setLayout: React.Dispatch<React.SetStateAction<SerializedDockview | null>>;
};
export default function Action(props: TProps) {
  const {api, layout, setLayout} = props;
  const [panelCount, setPanelCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [disablePanelDrag, setDisablePanelDrag] = useState(false);
  const [disableGroupDrag, setDisableGroupDrag] = useState(false);
  const [disableOverlay, setDisableOverlay] = useState(false);

  // 生命周期
  useEffect(() => {
    if (!api) return;
    const disposables = [
      api.onDidLayoutChange(() => {
        // 可持久化layout
      }),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api]);
  // 监听数量
  useEffect(() => {
    if (!api) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPanelCount(api.panels.length);
    setGroupCount(api.groups.length);
    const disposables = [
      api.onDidAddPanel(() => setPanelCount(api.panels.length)),
      api.onDidRemovePanel(() => setPanelCount(api.panels.length)),
      api.onDidAddGroup(() => setGroupCount(api.groups.length)),
      api.onDidRemoveGroup(() => setGroupCount(api.groups.length)),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api]);

  // 监听拖拽状态
  useEffect(() => {
    if (!api) return;
    const disposables = [
      api.onWillDragPanel((e) => {
        if (!disablePanelDrag) return;
        e.nativeEvent.preventDefault();
      }),
      api.onWillDragGroup((e) => {
        if (!disableGroupDrag) return;
        e.nativeEvent.preventDefault();
      }),
      api.onWillShowOverlay((e) => {
        if (!disableOverlay) return;
        e.preventDefault();
      }),
    ];

    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api, disablePanelDrag, disableGroupDrag, disableOverlay]);

  // 监听拖拽行为
  useEffect(() => {
    if (!api) return;
    const disposables = [
      api.onWillDragPanel((event) => {
        console.log('onWillDragPanel');
        const dataTransfer = event.nativeEvent.dataTransfer;
        // 提供数据给放置元素
        if (dataTransfer) {
          dataTransfer.setData(
            dropMimeType,
            JSON.stringify({type: 'panel', id: event.panel.id, text: 'Some custom panel data transfer data'})
          );
        }
      }),

      api.onWillDragGroup((event) => {
        console.log('onWillDragGroup');
        const dataTransfer = event.nativeEvent.dataTransfer;
        if (dataTransfer) {
          dataTransfer.setData(
            dropMimeType,
            // group.id 为系统自动生成
            JSON.stringify({type: 'group', id: event.group.id, text: 'Some custom group data transfer data'})
          );
        }
      }),
      // 让拖拽至dock生效的api
      api.onUnhandledDragOverEvent((event) => {
        // 浏览器在 dragover（也就是 Dockview 的 onUnhandledDragOverEvent）阶段禁止访问 dataTransfer.getData()
        const types = event.nativeEvent.dataTransfer?.types || [];
        // 满足自定义的条件才允许拖拽
        if (types.includes(dragMimeTYpe)) {
          // const idType = types.find(type => type === dragIdMimeTYpe);
          // if (idType) {
          //   const id = idType.replace('application/', '');
          //   const exists = api.getPanel(id);
          //   if (exists) return; // 考虑到如果有提示信息，建议在onDidDrop中处理
          // }
          event.accept();
        }
      }),
      api.onWillDrop((event) => {
        console.log('onWillDrop', event);
      }),
      api.onDidDrop((event) => {
        console.log('onDidDrop', event);
      }),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api]);

  const handleSave = () => {
    if (!api) return;
    setLayout(api.toJSON());
  };

  const handleRestore = () => {
    if (!api) return;
    if (!layout) return;
    api.clear();
    api.fromJSON(layout);
  };

  const handleClear = () => {
    if (!api) return;
    api.clear();
  };

  const handleAdd = () => {
    if (!api) return;
    // @ts-expect-error todo
    const _panel = addPanel(api, {component: PanelType.common});
    // panel.group.header.hidden = true;
    // panel.group.locked = true;
  };

  return (
    <div className="flex flex-wrap gap-2 [&>Label]:rounded-md [&>Label]:border [&>Label]:p-2">
      <Label>
        groups: {groupCount}, panels: {panelCount}
      </Label>
      <Label>
        <Checkbox checked={!disablePanelDrag} onCheckedChange={(checked: boolean) => setDisablePanelDrag(!checked)} />
        启用 Panel 拖拽
      </Label>
      <Label>
        <Checkbox checked={!disableGroupDrag} onCheckedChange={(checked: boolean) => setDisableGroupDrag(!checked)} />
        启用 Group 拖拽
      </Label>
      <Label>
        <Checkbox checked={!disableOverlay} onCheckedChange={(checked: boolean) => setDisableOverlay(!checked)} />
        显示 overlay
      </Label>
      <DraggableElement />
      <DroppableElement />
      <hr className="w-full border-none p-0!" />
      <Button onClick={handleSave}>save</Button>
      <Button onClick={handleRestore}>restore</Button>
      <Button onClick={handleClear}>clear</Button>
      <Button onClick={() => api?.addGroup()}>add group</Button>
      <Button onClick={handleAdd}>add panel</Button>
    </div>
  );
}
