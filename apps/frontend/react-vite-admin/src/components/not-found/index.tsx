import {useNavigate} from 'react-router';
import {Button} from '@badnpm/ui';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist</p>
      <Button onClick={() => navigate('/')}>Back to Home</Button>
    </div>
  );
}
