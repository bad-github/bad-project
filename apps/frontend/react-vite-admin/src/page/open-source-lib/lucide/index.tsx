import {useTranslation} from 'react-i18next';
import {Loading} from '@badnpm/ui';
import {toast, BadInput, BadEmpty} from '@badnpm/ui';
import {memo, useDeferredValue, useMemo, useState} from 'react';
import {DynamicIcon, dynamicIconImports} from 'lucide-react/dynamic';

import {text} from '@workspace/utils';

type IconName = keyof typeof dynamicIconImports;

const IconItem = memo(({value}: {value: IconName}) => {
  {
    /* group-hover/tooltip:flex */
  }
  return (
    <div
      className="bg-accent hover:bg-primary grid size-8 cursor-pointer place-items-center rounded-md"
      title={value}
      onClick={() => text.copyText(value).then(() => toast.add({title: 'copied successfully', type: 'success'}))}
    >
      <DynamicIcon className="size-4" name={value as IconName} />
    </div>
  );
});

export default function LucidePage() {
  const {t} = useTranslation();
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  const allIcons = useMemo(() => Object.keys(dynamicIconImports) as IconName[], []);

  // icons最终结果是衍生计算，而非状态更新，所以不用渲染useTransition
  const icons = useMemo(() => {
    return allIcons.filter((key) => key.toLowerCase().includes(deferredFilter.toLowerCase()));
  }, [deferredFilter, allIcons]);

  return (
    <div className="flex flex-col gap-4">
      <BadInput
        className="max-w-md"
        allowClear
        placeholder="search icons"
        value={filter}
        onChange={(e) => {
          // 优先更新任务
          setFilter(e.target.value);
        }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] content-start gap-2">
          {icons.slice(0, 600).map((key) => {
            return <IconItem key={key} value={key} />;
          })}
        </div>
        {filter !== deferredFilter ? (
          <div className="flex justify-center">
            <Loading text={t('common.loading')} />
          </div>
        ) : (
          icons.length === 0 && <BadEmpty text={t('common.no-data')} />
        )}
      </div>
    </div>
  );
}
