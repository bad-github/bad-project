import type {Editor, Range} from '@tiptap/core';
import {TextSelection} from '@tiptap/pm/state';

export type CommandSuggestionState = {active: boolean; query: string; range: Range};

export function replaceSuggestionQuery(editor: Editor, range: Range, char: string, query: string) {
  if (editor.isDestroyed || !editor.isEditable) return false
  const from = range.from + char.length
  if (from > range.to || range.from < 0 || range.to > editor.state.doc.content.size) return false
  if (editor.state.doc.textBetween(range.from, from) !== char) return false
  // Search is plain text, including queries containing HTML-like characters.
  const tr = editor.state.tr.insertText(query, from, range.to)
  tr.setSelection(TextSelection.create(tr.doc, from + query.length))
  editor.view.dispatch(tr)
  return true
}

