import {Card, CardContent, CardHeader, CardTitle, BadEmpty} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';

export default function UIEmpty() {
  const {t} = useTranslation();
  return (
    <div className="grid auto-rows-[200px] grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.page')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BadEmpty text={t('common.no-data')} type="page" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.component')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BadEmpty text={t('common.no-data')} type="component" />
        </CardContent>
      </Card>
    </div>
  );
}
