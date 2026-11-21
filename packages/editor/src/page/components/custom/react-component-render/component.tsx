import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {NodeViewWrapper, type NodeViewProps} from '@tiptap/react';

export function Component(props: NodeViewProps) {
  const {attrs} = props.node;

  const increase = () => {
    props.updateAttributes({
      count: attrs.count + 1,
    });
  };
  return (
    <NodeViewWrapper className="react-component">
      <label>React Component</label>

      <div className="content">
        <Button onClick={increase}>This button has been clicked {attrs.count} times.</Button>
      </div>
    </NodeViewWrapper>
  );
}
