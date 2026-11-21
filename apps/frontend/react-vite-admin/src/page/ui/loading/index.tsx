import {Loading, LoadingOverlay, TiktokLoading} from '@badnpm/ui';
import {Card, CardContent, CardHeader, CardTitle, Skeleton} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';

export default function UILoading() {
  const {t} = useTranslation();
  return (
    <div className="grid auto-rows-[200px] grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 overflow-auto">
      <LoadingOverlay text={t('common.loading')} loading>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t('ui.wrappedContainer')}</CardTitle>
          </CardHeader>
        </Card>
      </LoadingOverlay>
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.page')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loading text={t('common.loading')} type="page" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.component')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loading text={t('common.loading')} type="component" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.area')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loading text={t('common.loading')} type="area" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.tiktok')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <TiktokLoading />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>骨架</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    </div>
  );
}
