import {TextAlignButtonContent} from '../page/components/text-align-button/content';
import {HeadingButtonContent} from '../page/components/heading-button/content';
import {MarkButtonContent} from '../page/components/mark-button/content';
import {ColorTextButtonContent} from '../page/components/color-text-button/content';
import {ColorHighlightButtonContent} from '../page/components/color-highlight-button/content';
import {BlockquoteContent} from '../page/components/blockquote-button/content';
import {CodeBlockButtonContent} from '../page/components/code-block-button/content';
import {ListButtonContent} from '../page/components/list-button/content';
import {CopyAnchorLinkContent} from '../page/components/copy-anchor-link-button/content';
import {LinkPopoverContent} from '../page/components/link-popover/content';
import {ImageAlignButtonContent} from '../page/components/image-align-button/content';
import {EmojiDropdownMenuContent} from '../page/components/emoji-dropdown-menu/content';
import {MentionDropdownMenuContent} from '../page/components/mention-dropdown-menu/content';
import {TableNodeContentStr} from '../page/node/table-node/table-content';

export const demoContent = `
      text
      ${TextAlignButtonContent}
      ${HeadingButtonContent}
      ${MarkButtonContent}
      ${ColorTextButtonContent}
      ${ColorHighlightButtonContent}
      ${BlockquoteContent}
      ${CodeBlockButtonContent}
      ${ListButtonContent}
      <hr/>
      ${CopyAnchorLinkContent}
      ${LinkPopoverContent}
      ${ImageAlignButtonContent}
      ${EmojiDropdownMenuContent}
      ${MentionDropdownMenuContent}
      ${TableNodeContentStr}
    `;
