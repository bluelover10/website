// Route transition: a keyed fade/slide wrapper keyed by pathname.
// Pure CSS animation — no layout thrash, no library.
import { useLocation } from 'react-router-dom';
import { cn } from '../utils/cn.js';

export function PageTransition({ children, className }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className={cn('animate-fade-up', className)}>
      {children}
    </div>
  );
}

export default PageTransition;
