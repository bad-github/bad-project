import AppProviders from './app-providers';
import {RouterProvider} from 'react-router';
import {router} from './router';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
