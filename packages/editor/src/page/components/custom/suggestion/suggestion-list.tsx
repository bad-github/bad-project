import {useEffect, useRef, useState} from 'react';
import type {SuggestionMenuRenderProps} from '../../../../components/tiptap-ui-utils/suggestion-menu/suggestion-menu-types';
import {CheckIcon} from '../../../../components/tiptap-icons/check-icon';
import type {MenuContext} from './menu-items';
import classes from './index.module.scss';
import type {Editor} from '@tiptap/react';
import type {PluginKey} from '@tiptap/pm/state';
import {exitSuggestion} from '@tiptap/suggestion';
import {replaceSuggestionQuery, type CommandSuggestionState} from './search';

type Props = SuggestionMenuRenderProps<MenuContext> & {
  editor: Editor;
  char: string;
  pluginKey: PluginKey<CommandSuggestionState>;
};

export function SuggestionList({items, selectedIndex, onSelect, editor, char, pluginKey}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  const query = pluginKey.getState(editor.state)?.query ?? '';

  const onQueryChange = (value: string) => {
    const state = pluginKey.getState(editor.state);
    if (state?.active) replaceSuggestionQuery(editor, state.range, char, value);
  };

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block: 'nearest'});
  }, [selectedIndex, items]);

  return (
    <div className={classes.popover}>
      <div className={classes.header}>
        <span>插入与格式</span>
        <span className={classes.count}>{items.length} 项命令</span>
      </div>
      <div className={classes.search}>
        <input
          type="search"
          aria-label="搜索命令"
          placeholder="搜索命令，如：标题、列表、table"
          value={draft ?? query}
          // 搜索框需要获得焦点；其余菜单区域仍沿用底层保留编辑器焦点的行为。
          onPointerDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            if (composing.current) setDraft(event.target.value);
            else onQueryChange(event.target.value);
          }}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={(event) => {
            composing.current = false;
            setDraft(null);
            onQueryChange(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Escape') {
              event.preventDefault();
              exitSuggestion(editor.view, pluginKey);
              editor.commands.focus();
            } else if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
              event.preventDefault();
              // 复用原有菜单导航，保证渲染与执行使用同一组选中索引。
              editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', {
                key: event.key, bubbles: true, cancelable: true,
              }));
            }
          }}
        />
      </div>
      <div className={classes.list} ref={listRef}>
        {items.length === 0 ? (
          <div className={classes.empty} role="status">
            <strong>暂无可用命令</strong>
            <span>试试“标题”“列表”或 table；部分命令仅在适用位置显示。</span>
          </div>
        ) : (
          items.map((item, index) => {
            const Icon = item.badge;
            const groupStart = index === 0 || item.group !== items[index - 1].group;
            return (
              <div key={item.context?.id ?? `${item.group ?? ''}:${item.title}:${index}`} role="presentation">
                {groupStart && (
                  <div className={classes.groupTitle} role="presentation">
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === selectedIndex}
                  className={classes.menuItem}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(item)}
                >
                  <span className={classes.iconWrapper} aria-hidden="true">
                    {typeof Icon === 'string' ? Icon : Icon && <Icon />}
                  </span>
                  <span className={classes.itemText}>
                    <span className={classes.title}>{item.title}</span>
                    <span className={classes.description}>{item.subtext}</span>
                  </span>
                  {item.context?.active && (
                    <span className={classes.active} aria-label="当前已启用">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className={classes.footer}>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 选择
        </span>
        <span>
          <kbd>Enter</kbd> 执行
        </span>
        <span>
          <kbd>Esc</kbd> 关闭
        </span>
      </div>
    </div>
  );
}
