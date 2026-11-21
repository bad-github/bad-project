'use client';

import {useTranslations} from 'next-intl';
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@badnpm/ui';
import type {technologies} from './data';
import TechnologyPreview from './technology-preview';

type Props = {
  technology: (typeof technologies)[number];
};

export default function TechnologyRow({technology}: Props) {
  const t = useTranslations('Skill');
  const Icon = technology.icon;
  const name = t(`technologies.${technology.id}.name`);
  const previewItems = technology.previewKeys.map((key) => t(key));

  return (
    <li className="transition-opacity duration-200 motion-reduce:transition-none">
      <HoverCard>
        <HoverCardTrigger
          delay={80}
          closeDelay={100}
          render={<div />}
          tabIndex={0}
          className="flex min-h-8 items-center gap-2 rounded-sm py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Icon aria-hidden="true" className={`size-4 shrink-0 ${technology.iconClassName}`} focusable="false" />
          <span className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="shrink-0 font-medium">{name}</span>
            <span aria-hidden="true" className="shrink-0 text-muted-foreground">/</span>
            <span className="truncate text-muted-foreground">
              {t(`technologies.${technology.id}.description`)}
            </span>
          </span>
          <a
            href={technology.href}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-[35%] shrink-0 truncate rounded-sm font-mono text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:max-w-none"
          >
            {new URL(technology.href).hostname.replace(/^www\./, '')}
          </a>
        </HoverCardTrigger>
        <HoverCardContent
          side="left"
          align="center"
          alignOffset={0}
          sideOffset={12}
          className="flex h-32 w-64 items-center justify-center overflow-hidden"
        >
          <TechnologyPreview name={name} icon={Icon} iconClassName={technology.iconClassName} items={previewItems} />
        </HoverCardContent>
      </HoverCard>
    </li>
  );
}
