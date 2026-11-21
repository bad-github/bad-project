import {useEffect, useMemo, useRef, useState} from 'react';
import {PaintBucketIcon} from '@workspace/editor/icons';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {Input} from '@workspace/editor/components/tiptap-ui-primitive/input';
import {Editor} from '@tiptap/react';
import {useConfig} from '@workspace/editor/provider/config-provider';
import {
  ColorHighlightShortcutBadge,
  useColorHighlight,
  type HighlightMode,
} from '@workspace/editor/components/tiptap-ui/color-highlight-button';

export function ColorHighlightPicker({
  editor,
  value,
  text = 'Color Highlight Picker',
  mode = 'mark',
  useColorValue = false,
}: {
  editor: Editor;
  value?: string;
  text?: string;
  mode?: HighlightMode;
  useColorValue?: boolean;
}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  const colorRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(value || '');
  const {
    isVisible,
    isActive,
    canColorHighlight,
    handleColorHighlight,
    label,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Icon: _,
    shortcutKeys,
  } = useColorHighlight({
    editor,
    highlightColor: color,
    useColorValue,
    label: `Toggle highlight to (${color || 'picker'})`,
    hideWhenUnavailable,
    mode,
    onApplied: ({color, label}) => console.log(`Applied ${label} text color: ${color}`),
  });

  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(value);
    }
  }, [value]);

  const buttonStyle = useMemo(
    () =>
      ({
        '--highlight-color': color,
      }) as React.CSSProperties,
    [color]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    setTimeout(() => {
      handleColorHighlight();
    }, 0);
  };

  const handleClick = () => {
    colorRef.current?.click();
  };

  if (!isVisible) return null;
  
  return (
    <div style={{position: 'relative'}}>
      <Input
        style={{opacity: 0, position: 'absolute', inset: 0, zIndex: -1}}
        type="color"
        ref={colorRef}
        value={color}
        onChange={handleInputChange}
      />

      <Button
        type="button"
        variant="ghost"
        data-active-state={isActive ? 'on' : 'off'}
        role="button"
        tabIndex={-1}
        disabled={!canColorHighlight}
        data-disabled={!canColorHighlight}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        style={buttonStyle}
      >
        <PaintBucketIcon
          className="tiptap-button-icon"
          style={{color, '--highlight-color': color} as React.CSSProperties}
        />
        {/* <Icon className="tiptap-button-icon" /> */}
        {showText && text && <span className="tiptap-button-text">{text}</span>}
        {showShortcut && <ColorHighlightShortcutBadge shortcutKeys={shortcutKeys} />}
      </Button>
    </div>
  );
}
