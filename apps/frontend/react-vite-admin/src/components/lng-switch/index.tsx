import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {LanguagesIcon} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  toast,
} from '@badnpm/ui';
import type {SupportedLang} from '@workspace/i18n';

type TLang = {
  label: string;
  value: SupportedLang;
  trigger: string;
};

export default function LngSwitch() {
  const langs = useMemo<TLang[]>(
    () => [
      {label: '简体中文', value: 'zh', trigger: '中'},
      {label: 'English', value: 'en', trigger: 'A'},
    ],
    []
  );
  const {i18n, t} = useTranslation();
  const [changing, setChanging] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={changing}
        render={<Button variant="ghost" size="icon" className="size-7 rounded-md" aria-busy={changing} />}
      >
        <LanguagesIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {langs.map((v) => (
          <DropdownMenuCheckboxItem
            key={v.value}
            checked={v.value === (i18n.resolvedLanguage ?? i18n.language)}
            closeOnClick
            onCheckedChange={() => {
              setChanging(true);
              void i18n.changeLanguage(v.value, (error) => {
                setChanging(false);
                // i18next 的 Promise 在加载失败时也可能 resolve，错误应通过回调处理。
                if (error) {
                  toast.add({title: t('common.languageLoadFailed'), type: 'error'});
                  console.error('Failed to change language', error);
                }
              });
            }}
          >
            {v.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
