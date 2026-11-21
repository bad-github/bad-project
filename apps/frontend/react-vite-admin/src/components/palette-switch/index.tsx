import {useId, type CSSProperties} from 'react';
import {useTranslation} from 'react-i18next';

import {Button, Label, RadioGroup, RadioGroupItem, usePreference, cn} from '@badnpm/ui';
import {CheckIcon, PaletteIcon} from 'lucide-react';
import {ColorMap, SimpleColors} from '@/utils/theme';

export default function PaletteSwitch() {
  const {theme: color, setTheme: setColor} = usePreference();
  const {t} = useTranslation();
  const id = useId();
  const width = SimpleColors.length * 30;

  return (
    <>
      <div className="group/palette flex items-center">
        <RadioGroup
          style={{'--palette-width': `${width}px`} as CSSProperties}
          value={color}
          aria-label={t('preference.buildInTheme')}
          onValueChange={(value) => {
            const next = SimpleColors.find((v) => v === value);
            if (next) setColor(next);
          }}
          className="flex w-0 items-center overflow-hidden transition-all duration-500 ease-out group-focus-within/palette:w-[var(--palette-width)] group-hover/palette:w-[var(--palette-width)]"
        >
          {SimpleColors.map((v) => (
            <div key={v} className="relative flex size-5 shrink-0 items-center justify-center">
              <RadioGroupItem
                value={v}
                id={`${id}-color-${v}`}
                aria-label={t(`preference.${v}`)}
                className="peer sr-only absolute"
              />
              <Label
                title={t(`preference.${v}`)}
                aria-label={t(`preference.${v}`)}
                htmlFor={`${id}-color-${v}`}
                className={cn(
                  'peer-focus-visible:ring-ring flex size-5 cursor-pointer justify-center rounded-full border peer-focus-visible:ring-2',
                  v === color && 'border-primary'
                )}
              >
                <span
                  style={{backgroundColor: ColorMap[v]}}
                  className="flex size-full items-center justify-center rounded-full"
                >
                  {v === color && <CheckIcon className="size-3" />}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Button variant="ghost" size="icon" className="size-7 rounded-md">
          <PaletteIcon />
          <span className="sr-only">Toggle palette</span>
        </Button>
      </div>
    </>
  );
}
