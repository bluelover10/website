import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <div className="mt-5 flex gap-2">
        <Link to="/"><Button variant="secondary">Home</Button></Link>
        <Link to="/dashboard"><Button>Dashboard</Button></Link>
      </div>
    </div>
  );
}

export default NotFound;
