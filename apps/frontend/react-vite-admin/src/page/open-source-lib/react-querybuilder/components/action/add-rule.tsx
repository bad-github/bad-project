import {Button} from '@badnpm/ui';
import {Plus} from 'lucide-react';
import type {ActionProps} from 'react-querybuilder';

export default function AddRule(props: ActionProps) {
  return (
    <Button size="sm" onClick={props.handleOnClick}>
      Rule
      <Plus />
    </Button>
  );
}
