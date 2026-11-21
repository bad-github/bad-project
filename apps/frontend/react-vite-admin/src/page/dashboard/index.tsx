import {Button} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';

export default function Dashboard() {
  const {t} = useTranslation();
  return (
    <div className="no-scrollbar">
      <Button className="shadow-md shadow-red-400">{t('dashboard.dashboard')}</Button>
    </div>
  );
}
