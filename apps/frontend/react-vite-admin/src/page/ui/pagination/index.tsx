import {BadPagination} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';

export default function UIPagination() {
  const {t} = useTranslation();
  return (
    <div>
      <BadPagination
        total={100}
        defaultCurrent={2}
        defaultPageSize={50}
        showSizeChanger
        showQuickJumper
        showTotal={(total) => t('ui.total', {total})}
        previousContent={t('ui.previous')}
        nextContent={t('ui.next')}
      />
    </div>
  );
}
