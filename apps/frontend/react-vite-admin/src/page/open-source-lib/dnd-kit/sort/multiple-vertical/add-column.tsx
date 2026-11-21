import {Button} from '@badnpm/ui';
import {PlusIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';

type TProps = {
  addColumn: () => void;
};
export default function AddColumn(props: TProps) {
  const {t} = useTranslation();
  const {addColumn} = props;
  return (
    <div className="flex min-h-0 items-center justify-center rounded-md border-1">
      <Button variant="outline" onClick={() => addColumn()}>
        <PlusIcon />
        {t('lib.addColumn')}
      </Button>
    </div>
  );
}
