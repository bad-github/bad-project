'use client';

import type {MouseEvent} from 'react';
import GithubIcon from '@/assets/svg/github.svg';
import XIcon from '@/assets/svg/x.svg';

function preventNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      <a
        href="#"
        onClick={preventNavigation}
        aria-label="X"
        title="X"
        className="hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </a>
      <a
        href="#"
        onClick={preventNavigation}
        aria-label="GitHub"
        title="GitHub"
        className="hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors"
      >
        <GithubIcon aria-hidden="true" className="size-5" />
      </a>
    </div>
  );
}
