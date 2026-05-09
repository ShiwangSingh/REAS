import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const isAuthenticated = useUserStore((s) => s.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the current location to return to after login
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
