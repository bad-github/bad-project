import {NodeViewContent, NodeViewWrapper, type NodeViewProps} from '@tiptap/react';
import {useTiptapEditor} from '@workspace/editor/provider/editor-provider';
import './code-block-component.scss';
import './styles.scss';

export function CodeBlockComponent(props: NodeViewProps) {
  const {editable} = useTiptapEditor();
  const {
    node: {
      attrs: {language: defaultLanguage},
    },
    updateAttributes,
    extension,
  } = props;
  return (
    <NodeViewWrapper className="code-block">
      <select
        contentEditable={false}
        disabled={!editable}
        defaultValue={defaultLanguage}
        onChange={(event) => {
          if (props.editor.isEditable) updateAttributes({language: event.target.value});
        }}
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {extension.options.lowlight.listLanguages().map((lang: any, index: number) => (
          <option key={index} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre>
        {/* @ts-expect-error todo api */}
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
