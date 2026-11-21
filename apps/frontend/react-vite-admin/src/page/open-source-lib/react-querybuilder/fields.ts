import {type Field, type FullField, toFullOption} from 'react-querybuilder';
import {customOperators} from './tool';
import {getEditorComponent} from './editor-component';

/**
 * inputType：只对<input> 标签有效
 * valueEditorType：展现形式，select、radio、checkbox、multiselect
 */
export const initFields: FullField[] = (
  [
    // placeholder、operators、datatype
    {name: 'textName', label: '文本', inputType: 'text', placeholder: '请输入'},
    {name: 'numberName', label: '数字', inputType: 'number', placeholder: '请输入'},
    {
      name: 'selectName',
      label: '单选 select',
      inputType: 'select',
      placeholder: '请选择',
      valueEditorType: 'select',
      // defaultValue
      values: [
        {label: '选项1', name: 'select-1'},
        {label: '选项2', name: 'select-2'},
      ],
    },
    {
      name: 'checkboxName',
      label: '多选 checkbox',
      /**
       * 如果要让默认的DefaultValueEditor要支持array value，必须声明两个条件
       * (1)valueEditorType:'multiselect',
       * (2)操作符必须是['in', 'notIn', 'between', 'notBetween']
       *
       * 自定义的操作符无法支持array value，会被裁减为values[0]
       */
      //  valueEditorType: (op)=>'!='.includes(op)?'select':'multiselect',
      valueEditorType: 'checkbox',
      values: [
        {label: '选项1', name: 'checkbox-1'},
        {label: '选项2', name: 'checkbox-2'},
      ],
      operators: customOperators.filter((o) => ['in', 'notIn', 'between', 'notBetween'].includes(o.name)),
    },
    {
      name: 'multiselectName',
      label: '多选 select',
      placeholder: '请选择',
      valueEditorType: 'multiselect',
      values: [
        {label: '选项1', name: 'multiselect-1'},
        {label: '选项2', name: 'multiselect-2'},
      ],
    },
    {
      name: 'opSelectName',
      label: '操作符 select',
      inputType: 'select',
      placeholder: '请选择',
      valueEditorType: (op: string) => {
        if (['in', 'notIn'].includes(op)) {
          return 'multiselect';
        }
        return 'select';
      },
      values: [
        {label: '选项1', name: 'op-select-1'},
        {label: '选项2', name: 'op-select-2'},
      ],
    },
    {
      name: 'customComponent',
      label: '自定义组件',
      customComponent: getEditorComponent('value-set'),
      // 对某个条件指定独有的操作符
      operators: customOperators.filter((o) => ['<', '>', '<=', '>=', '='].includes(o.name)),
    },
  ] satisfies Field[]
).map((f) => toFullOption(f));
