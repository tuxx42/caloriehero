import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon(props: IconProps & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return <svg {...defaults} {...rest}>{children}</svg>;
}

// --- Nav ---

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </Icon>
  );
}

export function MealsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 7v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z" />
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10M12 7v10" strokeWidth={1} />
    </Icon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </Icon>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </Icon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </Icon>
  );
}

// --- Slots ---

export function SunriseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <path d="M16 12a4 4 0 11-8 0" />
      <path d="M3 17h18" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </Icon>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 3.6 7.2 3 6 3 3.8 3 2 5 2 7.5S4 14 12 21c8-7 10-11.5 10-13.5S16.2 3 14 3c-1.2 0-1.8.3-2 .5" />
      <path d="M12 3c0-1 .5-2 2-2" />
    </Icon>
  );
}

// --- Nutrients ---

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </Icon>
  );
}

export function ProteinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 12h12M6 12a4 4 0 01-4-4V6h4v2a2 2 0 104 0V6h4v2a2 2 0 104 0V6h4v2a4 4 0 01-4 4M6 12v4a4 4 0 004 4h4a4 4 0 004-4v-4" />
    </Icon>
  );
}

export function GrainIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 21a5 5 0 01-5-5c0-2.76 2.24-5 5-5s5 2.24 5 5" />
      <path d="M12 16a5 5 0 015-5c2.76 0 5 2.24 5 5s-2.24 5-5 5" />
      <path d="M12 3v13" />
      <path d="M8 7l4-4 4 4" />
    </Icon>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </Icon>
  );
}

export function FiberIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22c-4-4-8-7.5-8-12a8 8 0 0116 0c0 4.5-4 8-8 12z" />
      <path d="M12 10v6M9 13h6" />
    </Icon>
  );
}

export function SugarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2l1.5 3L17 6l-2 3 .5 3.5L12 11l-3.5 1.5L9 9 7 6l3.5-1L12 2z" />
      <path d="M8 15l-2 5h12l-2-5" />
    </Icon>
  );
}

// --- UI ---

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 18L18 6M6 6l12 12" />
    </Icon>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </Icon>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </Icon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1" />
      <path d="M7.5 7.5L12 12l4.5-4.5" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12l-4.5 4.5M12 12l4.5 4.5" />
    </Icon>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </Icon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </Icon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 13l4 4L19 7" />
    </Icon>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <path d="M1 10h22" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 3H1v13h15V3zM16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </Icon>
  );
}

export function CookingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v2m-4-1v3m8-3v3M4 12h16M5 12v5a3 3 0 003 3h8a3 3 0 003-3v-5" />
    </Icon>
  );
}

// Slot icon mapping
export const SLOT_ICONS: Record<string, React.FC<IconProps>> = {
  breakfast: SunriseIcon,
  lunch: SunIcon,
  dinner: MoonIcon,
  snack: AppleIcon,
};
