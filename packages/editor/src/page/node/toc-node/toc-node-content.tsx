import {TocSidebar} from '@workspace/editor/components/tiptap-node/toc-node';
import '@workspace/editor/components/tiptap-node/toc-node/toc-node.scss';
import '@workspace/editor/components/tiptap-node/toc-node/ui/toc-sidebar/toc-sidebar.scss';

export function TocNodeContent() {
  return <TocSidebar maxShowCount={20} topOffset={80} />;
}