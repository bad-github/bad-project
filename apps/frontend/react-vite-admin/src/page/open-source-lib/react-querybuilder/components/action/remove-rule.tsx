import type {ActionProps} from 'react-querybuilder';
import {Trash2} from 'lucide-react';
import {Button} from '@badnpm/ui';

export default function RemoveRule(props: ActionProps) {
  const {label, title, handleOnClick} = props;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      title={title}
      onClick={(e) => {
        e.preventDefault();
        handleOnClick();
      }}
    >
      <Trash2 />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
