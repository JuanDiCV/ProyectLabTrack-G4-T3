import { lazy, Suspense, useState, type ComponentType, type FormEvent, type SVGProps } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, type AlertVariant } from '../components/Alert';
import {
  BadgeUserIcon,
  CalendarClockIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  InboxCheckIcon,
  LayersIcon,
  LockIcon,
  LogoMark,
  PackageCheckIcon,
  RotateReturnIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from '../components/icons';

/** three.js se descarga solo en esta pantalla (no penaliza el resto de la app). */
const NetworkBackground = lazy(() =>
  import('../components/NetworkBackground').then((module) => ({ default: module.NetworkBackground })),
);
import { homePathFor, useAuth } from '../context/AuthContext';
import { isSecurityAlert, toUiError } from '../utils/errors';

interface Feedback {
  message: string;
  variant: AlertVariant;
}

type RoleMode = 'STUDENT' | 'ADMIN';
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface GuideItem {
  icon: Icon;
  title: string;
  description: string;
}

const STUDENT_STEPS: GuideItem[] = [
  {
    icon: SearchIcon,
    title: 'Explora el catálogo',
    description: 'Equipos de Cómputo, Electrónica y Redes con su disponibilidad al instante.',
  },
  {
    icon: CalendarClockIcon,
    title: 'Reserva tu horario',
    description: 'Elige fecha y bloque horario. Tu solicitud queda Pendiente hasta ser revisada.',
  },
  {
    icon: PackageCheckIcon,
    title: 'Retira y devuelve',
    description: 'Con la reserva Aprobada, recoge el equipo y entrégalo a tiempo.',
  },
];

const STUDENT_RULES: GuideItem[] = [
  {
    icon: LayersIcon,
    title: 'Un equipo a la vez',
    description: 'No puedes reservar dos equipos con horarios que se crucen el mismo día.',
  },
  {
    icon: ClockIcon,
    title: 'Devolución puntual',
    description: 'Entregar después de la hora fin te deja Penalizado y sin nuevas reservas.',
  },
  {
    icon: LockIcon,
    title: 'Acceso protegido',
    description: 'Tres intentos fallidos seguidos bloquean tu cuenta temporalmente.',
  },
];

const ADMIN_STEPS: GuideItem[] = [
  {
    icon: InboxCheckIcon,
    title: 'Revisa solicitudes',
    description: 'Aprueba las reservas pendientes o recházalas indicando el motivo.',
  },
  {
    icon: RotateReturnIcon,
    title: 'Registra devoluciones',
    description: 'Busca por nombre o código y libera el equipo en un clic.',
  },
  {
    icon: PackageCheckIcon,
    title: 'Inventario al día',
    description: 'El estado de cada equipo se actualiza automáticamente.',
  },
];

const ADMIN_RULES: GuideItem[] = [
  {
    icon: LayersIcon,
    title: 'Sin cruces de horario',
    description: 'Al aprobar se valida que el equipo no tenga otra reserva en ese bloque.',
  },
  {
    icon: ShieldIcon,
    title: 'Rechazo justificado',
    description: 'Todo rechazo requiere un motivo que el estudiante podrá consultar.',
  },
  {
    icon: ClockIcon,
    title: 'Penalización automática',
    description: 'Una devolución tardía marca al estudiante como Penalizado.',
  },
];

function GuideCard({ item }: { item: GuideItem }) {
  const IconComponent = item.icon;
  return (
    <li className="glass-tile p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-[#ffd24d]/25 to-[#ffb800]/10 text-teal-400 ring-1 ring-inset ring-teal-400/30">
        <IconComponent className="h-5 w-5" />
      </span>
      <h4 className="mt-3 text-sm font-semibold text-slate-100">{item.title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
    </li>
  );
}

/** HU-01: inicio de sesión con guía rápida para Estudiante y Encargado. */
export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState<RoleMode>('STUDENT');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(studentCode, password);
      navigate(homePathFor(loggedUser), { replace: true });
    } catch (error) {
      const uiError = toUiError(error);
      setFeedback({ message: uiError.message, variant: isSecurityAlert(uiError) ? 'security' : 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const applyDemoCredentials = (mode: RoleMode) => {
    setRoleMode(mode);
    setFeedback(null);
    setStudentCode(mode === 'STUDENT' ? '20261001' : 'ADMIN001');
    setPassword(mode === 'STUDENT' ? 'Estudiante123' : 'Admin123');
  };

  const selectRole = (mode: RoleMode) => {
    setRoleMode(mode);
    setFeedback(null);
  };

  const isStudent = roleMode === 'STUDENT';
  const steps = isStudent ? STUDENT_STEPS : ADMIN_STEPS;
  const rules = isStudent ? STUDENT_RULES : ADMIN_RULES;

  const tabClass = (active: boolean) =>
    `flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
      active
        ? 'bg-gradient-to-b from-[#ffcf40] to-[#ffb800] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_12px_-2px_rgba(255,184,0,0.45)]'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Suspense fallback={<div aria-hidden="true" className="fixed inset-0 z-0 bg-black" />}>
        <NetworkBackground />
      </Suspense>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          {/* Guía rápida */}
          <section aria-label="Guía rápida" className="card flex flex-col p-6 sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" />
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100">
                  Lab<span className="text-teal-400">Track</span>
                </h2>
                <p className="text-xs text-slate-400">Gestión de préstamos de laboratorios universitarios</p>
              </div>
            </div>

            <div className="mt-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-300 backdrop-blur">
                {isStudent ? <UserIcon className="h-3.5 w-3.5" /> : <BadgeUserIcon className="h-3.5 w-3.5" />}
                {isStudent ? 'Guía rápida · Estudiante' : 'Guía rápida · Encargado'}
              </span>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-100">
                {isStudent ? 'Reserva un equipo en tres pasos' : 'Gestiona el laboratorio con claridad'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {isStudent
                  ? 'Todo lo que necesitas saber antes de iniciar sesión.'
                  : 'Solicitudes, devoluciones e inventario en un solo lugar.'}
              </p>
            </div>

            <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Pasos">
              {steps.map((item) => (
                <GuideCard key={item.title} item={item} />
              ))}
            </ol>

            <h4 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isStudent ? 'Reglas a tener en cuenta' : 'Criterios del laboratorio'}
            </h4>
            <ul className="grid gap-3 sm:grid-cols-3" aria-label="Reglas">
              {rules.map((item) => (
                <GuideCard key={item.title} item={item} />
              ))}
            </ul>
          </section>

          {/* Inicio de sesión */}
          <section className="card flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
            <div>
              <div className="mb-6 text-center">
                <LogoMark className="mx-auto mb-3 h-16 w-16" />
                <h1 className="text-3xl font-bold tracking-tight">
                  Lab<span className="text-teal-400">Track</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">Sistema de Gestión de Préstamos de Laboratorios</p>
              </div>

              <div
                role="tablist"
                aria-label="Seleccionar tipo de usuario"
                className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-role-student"
                  data-testid="tab-role-student"
                  aria-selected={isStudent}
                  onClick={() => selectRole('STUDENT')}
                  className={tabClass(isStudent)}
                >
                  <UserIcon className="h-4 w-4" />
                  Estudiante
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-role-admin"
                  data-testid="tab-role-admin"
                  aria-selected={!isStudent}
                  onClick={() => selectRole('ADMIN')}
                  className={tabClass(!isStudent)}
                >
                  <BadgeUserIcon className="h-4 w-4" />
                  Encargado
                </button>
              </div>

              <form id="login-form" data-testid="login-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="input-student-code" className="label">
                    {isStudent ? 'Código de estudiante' : 'Código de encargado'}
                  </label>
                  <input
                    id="input-student-code"
                    data-testid="input-student-code"
                    name="studentCode"
                    type="text"
                    autoComplete="username"
                    className="input"
                    placeholder={isStudent ? 'Ej. 20261001' : 'Ej. ADMIN001'}
                    value={studentCode}
                    onChange={(event) => setStudentCode(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="input-password" className="label">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="input-password"
                      data-testid="input-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="input pr-11"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      id="btn-toggle-password"
                      data-testid="btn-toggle-password"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-teal-300 focus:outline-none focus-visible:text-teal-300"
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {feedback && <Alert message={feedback.message} variant={feedback.variant} />}

                <button
                  id="btn-login"
                  data-testid="btn-login"
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={submitting}
                >
                  {submitting ? 'Ingresando…' : 'Iniciar sesión'}
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acceso de prueba</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-fill-student"
                  data-testid="btn-fill-student"
                  onClick={() => applyDemoCredentials('STUDENT')}
                  className="glass-tile flex items-center gap-2.5 px-3 py-2 text-left"
                >
                  <UserIcon className="h-4 w-4 shrink-0 text-teal-400" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-100">Estudiante</span>
                    <span className="block truncate font-mono text-[10px] text-slate-400">20261001</span>
                  </span>
                </button>
                <button
                  type="button"
                  id="btn-fill-admin"
                  data-testid="btn-fill-admin"
                  onClick={() => applyDemoCredentials('ADMIN')}
                  className="glass-tile flex items-center gap-2.5 px-3 py-2 text-left"
                >
                  <BadgeUserIcon className="h-4 w-4 shrink-0 text-teal-400" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-100">Encargado</span>
                    <span className="block truncate font-mono text-[10px] text-slate-400">ADMIN001</span>
                  </span>
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                ¿Cuenta bloqueada o Penalizada? Acércate a la mesa de control del laboratorio con tu carné vigente.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
