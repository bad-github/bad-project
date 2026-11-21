import {ImproveDropdown} from '@workspace/editor/components/tiptap-ui/improve-dropdown';
import {useConfig} from '@workspace/editor/provider/config-provider';

export function GImproveDropdown() {
  const {hideWhenUnavailable} = useConfig();
  return (
    <ImproveDropdown
      textOptions={{
        stream: true,
        format: 'rich-text',
      }}
      hideWhenUnavailable={hideWhenUnavailable}
    />
  );
}
