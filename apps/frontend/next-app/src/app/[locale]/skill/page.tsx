'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Search} from 'lucide-react';
import {Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';
import {technologies, TECHNOLOGY_GROUPS} from './data';
import TechnologyRow from './technology-row';

export default function SkillPage() {
  const t = useTranslations('Skill');
  const description = t('description');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState('default');
  const sortItems = [
    {value: 'default', label: t('filters.defaultOrder')},
    {value: 'asc', label: 'A–Z'},
    {value: 'desc', label: 'Z–A'},
  ];
  const groupItems = [
    {value: 'all', label: t('filters.all')},
    ...TECHNOLOGY_GROUPS.map((value) => ({value, label: t(`groups.${value}`)})),
  ];
  const search = query.trim().toLocaleLowerCase();
  const filteredTechnologies = technologies.filter((technology) => {
    if (group !== 'all' && technology.group !== group) return false;

    const content = [
      technology.name,
      t(`technologies.${technology.id}.name`),
      t(`technologies.${technology.id}.description`),
    ].join(' ').toLocaleLowerCase();

    return content.includes(search);
  });

  if (sort !== 'default') {
    filteredTechnologies.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'en', {sensitivity: 'base'});
      return sort === 'asc' ? comparison : -comparison;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {description && <p className="text-sm leading-7 text-foreground/90">{description}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-24 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="off"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('filters.search')}
            aria-label={t('filters.search')}
            aria-controls="technology-list"
            className="rounded-sm border-0 bg-transparent pl-6 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <Select items={sortItems} value={sort} onValueChange={(value) => {if (value !== null) setSort(value);}}>
          <SelectTrigger aria-label={t('filters.sort')} className="shrink-0 rounded-sm border-0 bg-transparent px-1 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            <SelectGroup>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select items={groupItems} value={group} onValueChange={(value) => {if (value !== null) setGroup(value);}}>
          <SelectTrigger aria-label={t('filters.category')} className="shrink-0 rounded-sm border-0 bg-transparent px-1 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            <SelectGroup>
              {groupItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {/* :has(>li:hover) 匹配有直接子行被悬停的列表；>li:not(:hover) 仅淡化其他行，当前行保持原样。 */}
      <ul id="technology-list" className="flex flex-col gap-0.5 [&:has(>li:hover)>li:not(:hover)]:opacity-45">
        {filteredTechnologies.map((technology) => (
          <TechnologyRow key={technology.id} technology={technology} />
        ))}
      </ul>
      {filteredTechnologies.length === 0 && (
        <p role="status" className="py-4 text-sm text-muted-foreground">{t('filters.empty')}</p>
      )}
    </div>
  );
}
