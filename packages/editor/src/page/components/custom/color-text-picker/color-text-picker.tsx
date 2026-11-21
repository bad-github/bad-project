import {useEffect, useMemo, useRef, useState} from 'react';
import {BaselineIcon} from '@workspace/editor/icons';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {Input} from '@workspace/editor/components/tiptap-ui-primitive/input';
import {Editor} from '@tiptap/react';
import {ColorTextShortcutBadge, useColorText} from '@workspace/editor/components/tiptap-ui/color-text-button';
import {useConfig} from '@workspace/editor/provider/config-provider';

export function ColorTextPicker({
  editor,
  value, // 鼠标切换焦点时的颜色，自带的颜色选择器它们的颜色都是可枚举的
  text = 'Color Text Picker',
}: {
  editor: Editor;
  value?: string;
  text?: string;
}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  const colorRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(value || '');

  const {
    isVisible,
    isActive,
    canColorText,
    handleColorText,
    label,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Icon: _,
    shortcutKeys,
  } = useColorText({
    editor,
    textColor: color,
    label: `Color text to ${color || 'picker'}`,
    hideWhenUnavailable,
    onApplied: ({color, label}) => console.log(`Applied ${label} text color: ${color}`),
  });

  const buttonStyle = useMemo(
    () =>
      ({
        '--color-text-button-color': color,
      }) as React.CSSProperties,
    [color]
  );

  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    setTimeout(() => {
      // 使用改变后的颜色值
      handleColorText();
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
        disabled={!canColorText}
        data-disabled={!canColorText}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        style={buttonStyle}
      >
        <BaselineIcon className="tiptap-button-icon" style={{color}} />
        {/* <span className="tiptap-button-color-text" style={{color}}>
          <Icon className="tiptap-button-icon" style={{color, flexGrow: 1}} />
        </span> */}
        {showText && text && <span className="tiptap-button-text">{text}</span>}
        {showShortcut && <ColorTextShortcutBadge shortcutKeys={shortcutKeys} />}
      </Button>
    </div>
  );
}
