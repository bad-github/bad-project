import {SettingsIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  Sheet,
} from '@badnpm/ui';
import {useMemo} from 'react';
import Appearance from './appearance';
import Layout from './layout';

export default function Preference() {
  const {t} = useTranslation();

  const tabs = useMemo(() => {
    return [
      {value: 'appearance', label: t('preference.appearance'), component: <Appearance />},
      {value: 'layout', label: t('preference.layout'), component: <Layout />},
    ];
  }, [t]);

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="size-7 rounded-md" />}>
        <SettingsIcon />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t('preference.preference')}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-3">
          <Tabs defaultValue="appearance">
            <TabsList>
              {tabs.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {/* 切换tab时，会触发每个组件的effect */}
            {tabs.map((v) => (
              <TabsContent key={v.value} value={v.value} className="mt-4">
                {v.component}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <SheetFooter className="flex-row justify-end">
          <SheetClose render={<Button variant="outline" />}>{t('common.close')}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
