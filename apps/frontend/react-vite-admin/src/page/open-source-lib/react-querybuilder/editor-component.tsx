import {Button} from '@badnpm/ui';
import {number} from '@workspace/utils';
import type {ValueEditorProps} from 'react-querybuilder';

export function getEditorComponent(componentType: string) {
  return (props: ValueEditorProps) => (
    <div className="w-full">
      <EditorComponent {...props} componentType={componentType} />
    </div>
  );
}

export function EditorComponent(props: ValueEditorProps & {componentType: string}) {
  const {value, handleOnChange, componentType} = props;
  if (componentType === 'value-set') {
    return (
      <div>
        {/*或者设置复合属性： handleOnChange({customAttr: 'customValue'}) */}
        <Button size="sm" onClick={() => handleOnChange(number.getRandomInt(100))}>
          set random value
        </Button>
        &nbsp;&nbsp;
        <span>{value}</span>
      </div>
    );
  }
  return null;
}
