import Image from 'next/image';
import HaerinImage from '@/assets/image/haerin.png';
import SocialLinks from './social-links';

export default function Footer() {

  return (
    <footer className="border-t px-fluid-sm-lg">
      <div className="text-muted-foreground mx-auto flex min-h-40 w-full max-w-7xl flex-wrap items-center justify-between gap-6 py-8 text-sm">
        <p>© 2026</p>
        <div className="flex items-center gap-4">
          <Image src={HaerinImage} alt="" aria-hidden="true" className="size-16 object-contain motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-[1.05]" sizes="96px" />
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
