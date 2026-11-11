import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './icons';
import { StatusBadge } from './StatusBadge';

const STUDENT_LINKS = [
  { to: '/catalog', label: 'Catálogo', testId: 'nav-catalog' },
  { to: '/my-reservations', label: 'Mis reservas', testId: 'nav-my-reservations' },
];

const ADMIN_LINKS = [
  { to: '/admin/requests', label: 'Solicitudes', testId: 'nav-admin-requests' },
  { to: '/admin/returns', label: 'Devoluciones', testId: 'nav-admin-returns' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? ADMIN_LINKS : STUDENT_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
              <LogoMark className="h-8 w-8" />
              <span>
                Lab<span className="text-teal-400">Track</span>
              </span>
            </span>
            <nav className="flex gap-1" aria-label="Navegación principal">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  id={link.testId}
                  data-testid={link.testId}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="current-user" id="current-user" className="text-slate-300">
              {user?.name} <span className="text-slate-500">({user?.studentCode})</span>
            </span>
            {user?.role === 'STUDENT' && <StatusBadge status={user.status} testId="current-user-status" />}
            <button id="btn-logout" data-testid="btn-logout" type="button" className="btn-secondary" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
