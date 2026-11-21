import type {ReactNode} from 'react';

import {BadTooltip} from '@badnpm/ui';
import QuestionCircle from '@/assets/svg/circle-question-mark.svg?react';

export default function InfoTip({children}: {children: ReactNode}) {
  return (
    <BadTooltip
      trigger={{
        render: <span />,
        className: 'inline-flex shrink-0 cursor-help',
        'aria-label': '查看说明',
        children: <QuestionCircle aria-hidden="true" className="size-4" />,
      }}
      content={{children, className: 'max-w-xs whitespace-normal break-words leading-relaxed'}}
    />
  );
}
