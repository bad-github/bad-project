import {
  COPY_ANCHOR_LINK_SHORTCUT_KEY,
  CopyAnchorLinkButton,
  CopyAnchorLinkShortcutBadge,
} from '@workspace/editor/components/tiptap-ui/copy-anchor-link-button';
import {CopyLinkIcon} from '@workspace/editor/icons/copy-link-icon';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GCopyAnchorLinkButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <CopyAnchorLinkButton
      editor={editor}
      text={showText ? 'Copy Link' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onCopied={() => console.log('Link copied!')}
      onNodeIdNotFound={(found) => console.log(`Node ID found: ${found}`)}
      onExtractedNodeId={(nodeId) => console.log(`Extracted ID: ${nodeId}`)}
    >
      <>
        <CopyLinkIcon className="tiptap-button-icon" />
        {showText && <span className="tiptap-button-text">Copy Link</span>}
        {showShortcut && <CopyAnchorLinkShortcutBadge shortcutKeys={COPY_ANCHOR_LINK_SHORTCUT_KEY} />}
      </>
    </CopyAnchorLinkButton>
  );
}
