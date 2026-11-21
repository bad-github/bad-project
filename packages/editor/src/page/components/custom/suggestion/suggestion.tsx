import {SuggestionMenu} from '@workspace/editor/components/tiptap-ui-utils/suggestion-menu';
import type {Editor} from '@tiptap/react';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {getSuggestionItems} from './menu-items';
import {SuggestionList} from './suggestion-list';
import {useState} from 'react';
import {PluginKey} from '@tiptap/pm/state';
import type {CommandSuggestionState} from './search';

type TProps = {
  editor: Editor;
  char?: string;
};

export default function Suggestion({editor, char = '!'}: TProps) {
  const [pluginKey] = useState(() => new PluginKey<CommandSuggestionState>('editorCommandMenu'));
  const openMenu = () => {
    if (editor.isDestroyed || !editor.isEditable) return;

    const {$from} = editor.state.selection;
    const previousCharacter = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 1),
      $from.parentOffset,
      '\0',
      '\0'
    );
    // Suggestion 默认只在段落开头或空格后匹配触发字符。
    const prefix = $from.parentOffset > 0 && previousCharacter !== ' ' ? ' ' : '';
    editor.chain().focus().insertContent(`${prefix}${char}`).run();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        tabIndex={-1}
        tooltip={`插入与格式命令 · 输入 ${char} 搜索`}
        aria-label="打开命令菜单"
        aria-haspopup="listbox"
        disabled={!editor.isEditable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={openMenu}
      >
        {char}
      </Button>
      <SuggestionMenu
        editor={editor}
        char={char}
        pluginKey={pluginKey}
        selector="editor-command-menu"
        maxHeight={440}
        allowSpaces
        decorationContent="输入名称搜索…"
        decorationClass="tiptap-slash-decoration"
        items={({editor, query}) =>
          getSuggestionItems({
            editor,
            query,
            range: {from: editor.state.selection.from - char.length - query.length, to: editor.state.selection.from},
          })
        }
        // 每个条目在同一个事务内删除触发文本并执行命令，避免默认 command 重复删除。
        command={({editor, range, props}) => props.onSelect({editor, range, context: props.context})}
      >
        {(props) => <SuggestionList {...props} editor={editor} char={char} pluginKey={pluginKey} />}
      </SuggestionMenu>
    </>
  );
}
