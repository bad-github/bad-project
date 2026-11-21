import {SquareArrowOutUpRight} from 'lucide-react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import EditorCoverDark from '@/assets/image/editor-cover-dark.png';
import EditorCoverLight from '@/assets/image/editor-cover-light.png';
import ReactAdminPreviewDark from '@/assets/image/react-admin-preview-dark.png';
import ReactAdminPreviewLight from '@/assets/image/react-admin-preview-light.png';
import TeletubbiesPreview from '@/assets/image/teletubbies.jpeg';
import UICoverDark from '@/assets/image/ui-cover-dark.png';
import UICoverLight from '@/assets/image/ui-cover-light.png';
import GithubIcon from '@/assets/svg/github.svg';
import SparkleBurst from '@/components/sparkle-burst';

export default function PortfolioPage() {
  const t = useTranslations('Portfolio');
  const featuredProject = {
    website: 'https://react-vite-admin-sigma.vercel.app/g/sign-in',
    github: '#',
  };
  const projects = [
    {
      id: 'uiBase',
      website: 'https://bad-ui.gouych.workers.dev',
      github: '#',
      previewLight: UICoverLight,
      previewDark: UICoverDark,
    },
    {
      id: 'tiptapEditor',
      website: 'https://editor-puce-one.vercel.app',
      github: '#',
      previewLight: EditorCoverLight,
      previewDark: EditorCoverDark,
    },
    {id: 'project3', website: '#', github: '#', previewLight: TeletubbiesPreview, previewDark: TeletubbiesPreview},
    {id: 'project4', website: '#', github: '#', previewLight: TeletubbiesPreview, previewDark: TeletubbiesPreview},
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
      <section aria-labelledby="featured-heading">
        <div className="mb-4">
          <h2 id="featured-heading" className="text-xl font-semibold">
            {t('featured.heading')}
          </h2>
        </div>
        {/* 
        第一列：占剩余空间的 1.35 份，最小可缩到 0
        第二列：占 0.65 份，但宽度不能小于 280px
        */}
        {/* motion-safe: 仅在用户未开启系统“减少动态效果”时启用位移、缩放和过渡；下方作品卡片同样适用。 */}
        <article className="group bg-card grid rounded-2xl shadow-[0_-2px_10px_-2px_rgb(0_0_0/0.08),0_8px_20px_-6px_rgb(0_0_0/0.16)] dark:shadow-lg dark:shadow-black/40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="relative min-h-64 overflow-hidden rounded-t-2xl border-b border-b-border/50 md:min-h-96 md:rounded-l-2xl md:rounded-tr-none md:border-r md:border-r-border/50 md:border-b-0">
            <Image
              className="object-contain object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.025] dark:hidden"
              src={ReactAdminPreviewLight}
              alt={t('previewPlaceholder')}
              fill
              sizes="(max-width: 767px) 100vw, 68vw"
            />
            <Image
              className="hidden object-contain object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.025] dark:block"
              src={ReactAdminPreviewDark}
              alt={t('previewPlaceholder')}
              fill
              sizes="(max-width: 767px) 100vw, 68vw"
            />
          </div>
          <div className="flex flex-col justify-between gap-8 p-6 sm:p-8">
            <div>
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="min-w-0 flex-1 truncate text-xl font-semibold">{t('featured.title')}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  <SparkleBurst>
                    <a
                      className="text-foreground/60 hover:bg-muted hover:text-foreground rounded-md p-2 transition-colors"
                      href={featuredProject.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('actions.website')}
                      title={t('actions.website')}
                    >
                      <SquareArrowOutUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
                    </a>
                  </SparkleBurst>
                  <a
                    className="text-foreground/60 hover:bg-muted hover:text-foreground rounded-md p-2 transition-colors"
                    href={featuredProject.github}
                    aria-label={t('actions.github')}
                    title={t('actions.github')}
                  >
                    <GithubIcon aria-hidden="true" className="size-4" />
                  </a>
                </div>
              </div>
              <p className="text-foreground/50 mt-2 text-sm">{t('featured.category')}</p>
              <p className="text-foreground/70 mt-2 line-clamp-2 text-sm/6">{t('featured.description')}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={t('technologyLabel')}>
                {['React', 'Vite', 'TypeScript', 'Tailwind CSS'].map((technology) => (
                  <li key={technology} className="bg-muted rounded-full px-3 py-1 text-xs">
                    {technology}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section aria-labelledby="other-projects-heading">
        <div className="mb-4">
          <h2 id="other-projects-heading" className="text-xl font-semibold">
            {t('otherProjects.heading')}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="group bg-card flex flex-col overflow-hidden rounded-xl shadow-[0_-2px_10px_-2px_rgb(0_0_0/0.08),0_8px_20px_-6px_rgb(0_0_0/0.16)] dark:shadow-lg dark:shadow-black/40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1">
              <div className="relative aspect-video overflow-hidden border-b">
                <Image
                  className="object-cover object-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.025] dark:hidden"
                  src={project.previewLight}
                  alt={t('previewPlaceholder')}
                  fill
                  sizes="(max-width: 639px) 100vw, 50vw"
                />
                <Image
                  className="hidden object-cover object-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.025] dark:block"
                  src={project.previewDark}
                  alt={t('previewPlaceholder')}
                  fill
                  sizes="(max-width: 639px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <h3 className="min-w-0 flex-1 truncate text-lg font-semibold">{t(`${project.id}.title`)}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      className="text-foreground/60 hover:bg-muted hover:text-foreground rounded-md p-1.5 transition-colors"
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('actions.website')}
                      title={t('actions.website')}
                    >
                      <SquareArrowOutUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
                    </a>
                    <a
                      className="text-foreground/60 hover:bg-muted hover:text-foreground rounded-md p-1.5 transition-colors"
                      href={project.github}
                      aria-label={t('actions.github')}
                      title={t('actions.github')}
                    >
                      <GithubIcon aria-hidden="true" className="size-4" />
                    </a>
                  </div>
                </div>
                <p className="text-foreground/50 mt-2 text-xs">{t(`${project.id}.category`)}</p>
                <p className="text-foreground/70 mt-2 line-clamp-2 text-sm/6">{t(`${project.id}.description`)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
