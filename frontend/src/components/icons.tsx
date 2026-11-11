import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Matraz con flecha de seguimiento ascendente (símbolo de LabTrack). */
export function FlaskTrackIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.5 3h5" />
      <path d="M10 3v6.2L4.8 18.3A2 2 0 0 0 6.5 21.3h11a2 2 0 0 0 1.7-3L14 9.2V3" />
      <path d="M7.6 17.2l3.1-3.1 2 2 3.6-3.8" />
      <path d="M14.6 12.3h2.3v2.3" />
    </Base>
  );
}

export const SearchIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Base>
);

export const CalendarClockIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M12 13.2v2.4l1.7 1" />
  </Base>
);

export const PackageCheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
    <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" />
  </Base>
);

export const InboxCheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.5 13l2.4-7.2A2 2 0 0 1 7.8 4.5h8.4a2 2 0 0 1 1.9 1.3L20.5 13v4.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <path d="M3.5 13h4.3l1 2.5h6.4l1-2.5h4.3" />
    <path d="M9.5 9l2 2 3.5-3.7" />
  </Base>
);

export const RotateReturnIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 12a8 8 0 1 0 2.6-5.9" />
    <path d="M4 4.5v4h4" />
    <path d="M9.2 12.3l2 2 3.6-3.8" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3l7.5 3v5.5c0 4.4-3 7.8-7.5 9.5-4.5-1.7-7.5-5.1-7.5-9.5V6z" />
    <path d="M9 12l2.2 2.2L15.2 10" />
  </Base>
);

export const LockIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Base>
);

export const ClockIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Base>
);

export const LayersIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
    <path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" />
  </Base>
);

export const UserIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
  </Base>
);

export const BadgeUserIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="9" cy="11" r="2.2" />
    <path d="M5.8 16.2c.5-1.5 1.7-2.2 3.2-2.2s2.7.7 3.2 2.2M14.5 9.5h3.5M14.5 13h3.5" />
  </Base>
);

export const EyeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const EyeOffIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.3 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 3.7-.8" />
    <path d="M10 10a2.8 2.8 0 0 0 4 4" />
  </Base>
);

export const SparkleIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8z" />
  </Base>
);

interface LogoMarkProps {
  className?: string;
}

/** Logo de LabTrack: icono "glossy" estilo Apple en lúcuma UPN con matraz negro. */
export function LogoMark({ className = 'h-11 w-11' }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[28%] bg-gradient-to-b from-[#ffd24d] to-[#ffb800] shadow-[0_6px_18px_rgba(255,184,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(160,100,0,0.35)] ring-1 ring-white/30 ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-white/0" />
      <FlaskTrackIcon className="relative h-[58%] w-[58%] text-black" strokeWidth={2} />
    </span>
  );
}

