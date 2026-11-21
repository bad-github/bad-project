import {ApolloProvider} from '@apollo/client/react';
import {I18nextProvider} from 'react-i18next';
import {QueryClientProvider} from '@tanstack/react-query';
import {PreferenceProvider, ThemeProvider, TooltipProvider} from '@badnpm/ui';

import {StorageKeys} from './utils/storage-keys';
import queryClient from './query';
import {ToastProvider} from './provider/toast-provider';
import {apolloClient} from './graphql/apollo';
import ErrorContainer from './error/components/error-container';
import {i18n} from './i18n';

export default function AppProviders({children}: {children: React.ReactNode}) {
  return (
    <I18nextProvider i18n={i18n}>
      {/* 主题与配色偏好使用本应用的存储键；保留现有主题切换过渡动画。 */}
      <ThemeProvider defaultTheme="system" storageKey={StorageKeys.theme} disableTransitionOnChange={false}>
        <ErrorContainer />
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <PreferenceProvider storageKey={StorageKeys.preference}>
              <TooltipProvider>{children}</TooltipProvider>
            </PreferenceProvider>
          </QueryClientProvider>
          <ToastProvider />
        </ApolloProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
