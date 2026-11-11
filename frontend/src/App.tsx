import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { homePathFor, useAuth } from './context/AuthContext';
import { AdminRequestsPage } from './pages/AdminRequestsPage';
import { AdminReturnsPage } from './pages/AdminReturnsPage';
import { CatalogPage } from './pages/CatalogPage';
import { LoginPage } from './pages/LoginPage';
import { MyReservationsPage } from './pages/MyReservationsPage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute role="STUDENT" />}>
        <Route element={<Layout />}>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/my-reservations" element={<MyReservationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<Layout />}>
          <Route path="/admin/requests" element={<AdminRequestsPage />} />
          <Route path="/admin/returns" element={<AdminReturnsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
