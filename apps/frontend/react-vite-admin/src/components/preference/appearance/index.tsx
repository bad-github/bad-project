import {useId, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {MoonIcon, SunIcon, SunMoonIcon} from 'lucide-react';
import {
  BASE_COLORS,
  COLOR_THEMES,
  RADIUS_OPTIONS,
  Label,
  RadioGroup,
  RadioGroupItem,
  cn,
  usePreference,
} from '@badnpm/ui';
import {useTheme} from '@/hooks/use-theme';

const themes = ['light', 'dark', 'system'] as const;

export default function Appearance() {
  const {t} = useTranslation();
  const id = useId();
  // 复用 preference 中已有的颜色翻译；数字圆角无需翻译，新 label 回退到库原文。
  const translateLabel = (label: string) =>
    /^\d+(?:\.\d+)?$/.test(label) ? label : t(`preference.${label.toLowerCase()}`, {defaultValue: label});
  const {theme, setTheme} = useTheme();
  const {baseColor, theme: color, radius, setBaseColor, setTheme: setColor, setRadius} = usePreference();
  const iconMap = useMemo(() => {
    return {
      system: <SunMoonIcon />,
      light: <SunIcon />,
      dark: <MoonIcon />,
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>{t('preference.theme')}</h1>
        <RadioGroup
          value={theme}
          aria-label={t('preference.theme')}
          onValueChange={(value) => {
            const next = themes.find((v) => v === value);
            if (next) setTheme(next);
          }}
          className="mt-2 grid grid-cols-3 gap-4 max-sm:grid-cols-[repeat(auto-fit,minmax(54px,1fr))]"
        >
          {themes.map((v) => (
            <div key={v} className="text-center">
              <RadioGroupItem
                value={v}
                id={`${id}-theme-${v}`}
                aria-label={t(`preference.${v}`)}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${id}-theme-${v}`}
                className={cn(
                  'peer-focus-visible:ring-ring flex h-[48px] cursor-pointer justify-center rounded-md border peer-focus-visible:ring-2',
                  v !== theme && 'hover-animated-border',
                  v === theme && 'border-primary'
                )}
              >
                {iconMap[v]}
              </Label>
              <span className="text-xs">{t(`preference.${v}`)}</span>
            </div>
          ))}
        </RadioGroup>
      </div>
      {[
        {
          key: 'base-color',
          title: t('preference.baseColor'),
          value: baseColor,
          options: BASE_COLORS,
          onChange: (value: string) => {
            const option = BASE_COLORS.find((item) => item.value === value);
            if (option) setBaseColor(option.value);
          },
        },
        {
          key: 'color-theme',
          title: t('preference.colorTheme'),
          value: color,
          options: COLOR_THEMES,
          onChange: (value: string) => {
            const option = COLOR_THEMES.find((item) => item.value === value);
            if (option) setColor(option.value);
          },
        },
      ].map((group) => (
        <div key={group.key}>
          <h1>{group.title}</h1>
          <RadioGroup
            value={group.value}
            aria-label={group.title}
            onValueChange={group.onChange}
            className="mt-2 grid grid-cols-3 gap-4 max-sm:grid-cols-[repeat(auto-fit,minmax(54px,1fr))]"
          >
            {group.options.map((option) => (
              <div key={option.value} className="text-center">
                <RadioGroupItem
                  value={option.value}
                  id={`${id}-${group.key}-${option.value}`}
                  aria-label={translateLabel(option.label)}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${id}-${group.key}-${option.value}`}
                  className={cn(
                    'peer-focus-visible:ring-ring flex h-[48px] cursor-pointer justify-center rounded-md border peer-focus-visible:ring-2',
                    option.value !== group.value && 'hover-animated-border',
                    option.value === group.value && 'border-primary'
                  )}
                >
                  <span aria-hidden="true" style={{backgroundColor: option.color}} className="size-6 rounded-md" />
                </Label>
                <span className="text-xs">{translateLabel(option.label)}</span>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      <div>
        <h1>{t('preference.radius')}</h1>
        <RadioGroup
          value={radius}
          aria-label={t('preference.radius')}
          onValueChange={(value) => {
            const option = RADIUS_OPTIONS.find((item) => item.value === value);
            if (option) setRadius(option.value);
          }}
          className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(54px,1fr))]"
        >
          {RADIUS_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`${id}-radius-${option.value}`}
                aria-label={translateLabel(option.label)}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${id}-radius-${option.value}`}
                className={cn(
                  'peer-focus-visible:ring-ring flex min-h-11 cursor-pointer items-center justify-center rounded-md border py-1 peer-focus-visible:ring-2',
                  option.value === radius && 'border-primary'
                )}
              >
                {translateLabel(option.label)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
