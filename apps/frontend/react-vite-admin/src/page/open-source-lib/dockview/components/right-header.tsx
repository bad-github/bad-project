import type {IDockviewHeaderActionsProps} from 'dockview';
import {ExternalLink, Maximize2, Minimize2, PictureInPicture, Signal} from 'lucide-react';
import {useEffect, useState} from 'react';
import {iconClass} from '../tool';

export default function RightHeader(props: IDockviewHeaderActionsProps) {
  const activePanel = props.activePanel;
  const isGroupActive = props.isGroupActive;
  const [maximized, setMaximized] = useState(props.api.isMaximized());
  const [isPopout, setIsPopout] = useState(props.api.location.type === 'popout');

  useEffect(() => {
    const disposables = [
      props.containerApi.onDidMaximizedGroupChange(() => {
        // setMaximized(props.api.isMaximized());
        // 不会触发组件的render，需要维护一个状态
        setMaximized(props.api.isMaximized()); // 或 props.containerApi.hasMaximizedGroup();
      }),
      props.api.onDidLocationChange(() => {
        setIsPopout(props.api.location.type === 'popout');
      }),
    ];

    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [props.api, props.containerApi]);

  const handleDisplay = () => {
    if (maximized) {
      props.api.exitMaximized();
      // props.containerApi.exitMaximizedGroup();
    } else {
      props.api.maximize();
      // props.activePanel?.api.maximize();
    }
  };

  const handleWindow = () => {
    if (isPopout) {
      props.api.moveTo({position: 'right'});
    } else {
      // 还需要注入其他资源
      props.containerApi.addPopoutGroup(props.group);
    }
  };

  return (
    <div className="h-full flex items-center gap-1 pr-2">
      <span className="inline-flex justify-center items-center text-xs h-4 bg-green-500 p-2 rounded-full">
        {activePanel?.id}
      </span>
      <span>{isGroupActive && <Signal className="size-4 stroke-green-500" />}</span>
      <div className="flex gap-1">
        <span className={iconClass} title={maximized ? 'minimize view' : 'maximize view'} onClick={handleDisplay}>
          {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </span>
        <span className={iconClass} title={isPopout ? 'close window' : 'open in new window'} onClick={handleWindow}>
          {isPopout ? <PictureInPicture className="size-4" /> : <ExternalLink className="size-4" />}
        </span>
      </div>
    </div>
  );
}
