import {MaximizeIcon, MinimizeIcon} from 'lucide-react';
import {Button} from '@badnpm/ui';
import {useEffect, useState} from 'react';

export default function FullSwitch() {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const changeFull = () => {
      setFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', changeFull);
    return () => {
      document.removeEventListener('fullscreenchange', changeFull);
    };
  }, []);

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement?.requestFullscreen();
    }
  };
  return (
    <Button variant="ghost" size="icon" className="size-7 rounded-md" onClick={toggleFullScreen}>
      {fullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
      <span className="sr-only">Toggle Fullscreen</span>
    </Button>
  );
}
