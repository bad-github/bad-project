import {memo} from 'react';
import {useController, type UseFormReturn} from 'react-hook-form';
import type {FormSchema, TreeNode} from './schema';
import type {EditorProps} from './editors/types';
import TextEditor from './editors/text-editor';
import BooleanEditor from './editors/boolean-editor';
import ChoiceEditor from './editors/choice-editor';
import RangeEditor from './editors/range-editor';
import DateEditor from './editors/date-editor';
import FieldFeedback from './field-feedback';
import UncontrolledEditor from './editors/uncontrolled-editor';
import {isUncontrolledType} from './value-adapters';

/** 路由只选择编辑器类别，组件差异放到对应适配器中；未知类型由 TS 穷尽检查提示。 */
function Editor(props: EditorProps) {
  const type = props.config.type;
  switch (type) {
    case 'input-otp':
      return <TextEditor {...props} />;
    case 'switch':
    case 'checkbox':
    case 'toggle':
      return <BooleanEditor {...props} />;
    case 'select':
    case 'multi-select':
    case 'radio-group':
    case 'checkbox-group':
    case 'combobox':
    case 'toggle-group':
      return <ChoiceEditor {...props} />;
    case 'slider':
    case 'range-slider':
      return <RangeEditor {...props} />;
    case 'date':
    case 'date-range':
      return <DateEditor {...props} />;
    // 这几个类型已由 EditableCell 分派到非受控分支。
    case 'input':
    case 'password':
    case 'number':
    case 'textarea':
    case 'native-select':
      return null;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

type Props = {node: TreeNode; form: UseFormReturn<FormSchema>};

/** 只有复杂控件订阅字段值；错误展示交由独立的 FieldFeedback 订阅。 */
function ControlledCell({node, form}: Props) {
  const name = `values.${node.id}` as const;
  const {field} = useController({name, control: form.control});
  const id = `tree-control-${node.id}`;
  return (
    <FieldFeedback form={form} name={name} id={id}>
      {({invalid, describedBy}) => (
        <Editor
          config={node.control}
          value={field.value ?? null}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          name={field.name}
          id={id}
          label={node.label}
          invalid={invalid}
          describedBy={describedBy}
        />
      )}
    </FieldFeedback>
  );
}

/** 此层不订阅表单状态。通过独立子组件切换接入方式，保证 Hooks 调用顺序始终稳定。 */
function EditableCell(props: Props) {
  return isUncontrolledType(props.node.control.type) ? (
    <UncontrolledEditor {...props} />
  ) : (
    <ControlledCell {...props} />
  );
}
export default memo(EditableCell);
