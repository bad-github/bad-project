import {useTranslation} from 'react-i18next';
import {Loading} from '@badnpm/ui';

import useAuth from './use-auth';
import {Navigate, Outlet} from 'react-router';

export default function AuthIntercept() {
  const {t} = useTranslation();
  const {loading, session} = useAuth();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading text={t('common.loading')} type="page" />
      </div>
    );

  if (!session) return <Navigate to="/sign-in" replace />;

  return <Outlet />;
}
