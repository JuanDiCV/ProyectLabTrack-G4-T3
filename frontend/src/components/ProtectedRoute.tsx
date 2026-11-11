import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface ProtectedRouteProps {
  role: Role;
}

/** Permite el acceso solo a usuarios autenticados con el rol indicado. */
export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return <Outlet />;
}
