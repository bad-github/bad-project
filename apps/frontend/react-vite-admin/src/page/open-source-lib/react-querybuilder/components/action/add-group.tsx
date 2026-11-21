import type {ActionProps} from 'react-querybuilder';
import {Plus} from 'lucide-react';
import {Button} from '@badnpm/ui';

export default function AddGroup(props: ActionProps) {
  return (
    <Button size="sm" onClick={props.handleOnClick}>
      Group
      <Plus />
    </Button>
  );
}
