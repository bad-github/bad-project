import {Button} from '@badnpm/ui';
import type {ValueEditorProps} from 'react-querybuilder';

export default function ValueControl(props: ValueEditorProps) {
  const {handleOnChange} = props;
  return (
    <div>
      <Button size="sm" onClick={() => handleOnChange({customAttr: 'customValue'})}>
        set
      </Button>
    </div>
  );
}
