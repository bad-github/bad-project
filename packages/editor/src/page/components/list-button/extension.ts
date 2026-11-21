import {TaskItem, TaskList} from '@tiptap/extension-list';

export const ListButtonExtension = [
  // StarterKit,
  TaskList,
  TaskItem.configure({nested: true}),
];
