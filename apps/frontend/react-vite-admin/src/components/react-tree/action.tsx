import type {ReactTreeLocale} from './locale';
import type {ReactTreeNode as TreeNode} from './types';
import type {NodeApi} from 'react-arborist';
import {PencilIcon, PlusIcon, TrashIcon} from 'lucide-react';
import {toast} from '@badnpm/ui';

type TActionProps<T extends TreeNode> = {
  node: NodeApi<T>;
  locale: ReactTreeLocale;
};

export default function Action<T extends TreeNode>({node, locale}: TActionProps<T>) {
  return (
    <span className="ml-auto flex gap-1 pr-1">
      {node.isInternal && (
        <PlusIcon
          className="size-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (!node.isEditable) return;
            toast.add({title: `[${node.data.name}] ${locale.createNode}`, type: 'info'});
          }}
        />
      )}

      <PencilIcon
        className="size-4 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!node.isEditable) return;
          toast.add({title: `${locale.editNode} [${node.data.name}]`, type: 'info'});
        }}
      />
      <TrashIcon
        className="size-4 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!node.isEditable) return;
          toast.add({title: `${locale.deleteNode} [${node.data.name}]`, type: 'info'});
        }}
      />
    </span>
  );
}
