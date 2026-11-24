import type { ReactNode } from "react";

export type IconName =
  | "search"
  | "star"
  | "starFilled"
  | "menu"
  | "close"
  | "arrowRight"
  | "arrowLeft"
  | "arrowUpRight"
  | "arrowUpDown"
  | "check"
  | "copy"
  | "refresh"
  | "shuffle"
  | "dice"
  | "key"
  | "atSign"
  | "hash"
  | "list"
  | "palette"
  | "qr"
  | "fileText"
  | "typeCase"
  | "percent"
  | "ruler"
  | "activity"
  | "calendar"
  | "timer"
  | "gauge"
  | "cpu"
  | "shield"
  | "lock"
  | "zap"
  | "sparkles"
  | "chevronDown"
  | "chevronRight"
  | "chevronLeft"
  | "download"
  | "link"
  | "trash"
  | "play"
  | "pause"
  | "plus"
  | "minus"
  | "info"
  | "alert"
  | "wifi"
  | "globe"
  | "mail"
  | "external"
  | "command"
  | "filter"
  | "calculator"
  | "eye"
  | "eyeOff"
  | "user"
  | "clock"
  | "flag"
  | "scale"
  | "layers"
  | "heart"
  | "bookmark"
  | "send"
  | "checkCircle"
  | "code"
  | "binary"
  | "diff"
  | "markdown"
  | "module"
  | "image"
  | "contrast"
  | "gradient"
  | "terminal"
  | "history";

const iconPaths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  star: (
    <path d="m12 3.6 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 17.12 6.7 19.9l1.01-5.9L3.42 9.83l5.93-.86L12 3.6Z" />
  ),
  starFilled: (
    <path
      d="m12 3.6 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 17.12 6.7 19.9l1.01-5.9L3.42 9.83l5.93-.86L12 3.6Z"
      fill="currentColor"
    />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M20 12H5m6 6-6-6 6-6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  arrowUpDown: <path d="M8 4v16m0 0-3.5-3.5M8 20l3.5-3.5M16 20V4m0 0 3.5 3.5M16 4l-3.5 3.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 6.5" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.2" />
      <path d="M15.5 5.5V5A1.8 1.8 0 0 0 13.7 3.2H5.8A1.8 1.8 0 0 0 4 5v7.9a1.8 1.8 0 0 0 1.8 1.8h.7" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 4v5h-5" />
    </>
  ),
  shuffle: (
    <>
      <path d="M3 5h3.5c1.5 0 2.5.8 3.4 2.1l4.2 7.8c.9 1.3 1.9 2.1 3.4 2.1H21" />
      <path d="M3 19h3.5c1.5 0 2.5-.8 3.4-2.1l.7-1.3M13.2 9.4l.9-1.3C15 6.8 16 6 17.5 6H21" />
      <path d="m18 3 3 3-3 3M18 15l3 3-3 3" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.2" cy="8.2" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="8.2" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.2" cy="15.8" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="15.8" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="16" r="3.7" />
      <path d="m10.2 13.3 8.4-8.4M16 7.5l2.8 2.8M18.8 4.7l1.6 1.6" />
    </>
  ),
  atSign: (
    <>
      <circle cx="12" cy="12" r="3.9" />
      <path d="M16 8.1v5.2a2.7 2.7 0 0 0 5.4 0v-1.2a9.4 9.4 0 1 0-3.7 7.5" />
    </>
  ),
  hash: <path d="M4 9h16M4 15h16M9.5 3 7 21M17 3l-2.5 18" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h7" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2.1-1 2.1-2.1 0-1.4 1-2.1 2.2-2.1h1.5A3.2 3.2 0 0 0 21 13.6 9 9 0 0 0 12 3Z" />
      <circle cx="7.6" cy="11.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="7.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="6.5" height="6.5" rx="1" />
      <rect x="14.5" y="3" width="6.5" height="6.5" rx="1" />
      <rect x="3" y="14.5" width="6.5" height="6.5" rx="1" />
      <path d="M14.5 14.5h3v3h-3zM20 14.5h1M20.5 20.5h.5M17 20h.5M14.5 20.5v.5" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M8.5 13h7M8.5 17h4" />
    </>
  ),
  typeCase: (
    <>
      <path d="M3 7V5h8v2M7 5v12M4.5 17H9" />
      <path d="M13 12v-1h6v5" />
      <path d="M20 13.5a3.5 3.5 0 1 0 0 5.5v-5.5Z" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="6.7" cy="6.7" r="2.6" />
      <circle cx="17.3" cy="17.3" r="2.6" />
    </>
  ),
  ruler: (
    <>
      <path d="M15.2 2.8 21.2 8.8a1 1 0 0 1 0 1.4L10.2 21.2a1 1 0 0 1-1.4 0L2.8 15.2a1 1 0 0 1 0-1.4L13.8 2.8a1 1 0 0 1 1.4 0Z" />
      <path d="m7 10 2 2M10 7l2 2M13 4l2 2M4 13l2 2" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 8.5L9 3.5 6 12H2" />,
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.2" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 9.5v4.2l2.7 1.6M9 2.5h6M12 2.5v3" />
    </>
  ),
  gauge: (
    <>
      <path d="M3.4 18.5a10 10 0 1 1 17.2 0" />
      <path d="m12 14 4.2-4.2" />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  cpu: (
    <>
      <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 2.5v3M15 2.5v3M9 18.5v3M15 18.5v3M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" />
    </>
  ),
  shield: (
    <>
      <path d="M20 12.5c0 5-3.4 7.4-8 8.8-4.6-1.4-8-3.8-8-8.8V5.8L12 2.9l8 2.9v6.7Z" />
      <path d="m8.8 12 2.2 2.2 4.3-4.3" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2.2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  zap: <path d="M13 2 4.2 13.5h7L10.2 22l9-11.5h-7L13 2Z" />,
  sparkles: (
    <>
      <path d="m11 3 1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7L11 3Z" />
      <path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4.5 21h15" />,
  link: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.3" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13.5h9l1-13.5M10 11v5.5M14 11v5.5" />,
  play: <path d="M7.5 4.5v15l12-7.5-12-7.5Z" />,
  pause: <path d="M8.5 4.5v15M15.5 4.5v15" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.5 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 8.8a14.5 14.5 0 0 1 19 0M5.8 12.4a9.5 9.5 0 0 1 12.4 0M9.2 16a4.5 4.5 0 0 1 5.6 0" />
      <circle cx="12" cy="19.4" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14v5a1.8 1.8 0 0 1-1.8 1.8H5A1.8 1.8 0 0 1 3.2 19V7.8A1.8 1.8 0 0 1 5 6h5" />
    </>
  ),
  command: (
    <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" />
  ),
  filter: <path d="M4 5h16l-6.3 7.6v5.9L10.3 21v-8.4L4 5Z" />,
  calculator: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2.2" />
      <path d="M7.5 6.5h9M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-3.3 3.9M6.3 6.3C4 8 2.5 12 2.5 12s3.5 6.1 9.5 6.1a9.7 9.7 0 0 0 3.6-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  flag: <path d="M5 21V4m0 0h11l-1.2 3.8H21l-1.8 4.4L21 16H12.4L11 12H5" />,
  scale: (
    <>
      <path d="M12 3v18M7.5 21h9M5 6h14" />
      <path d="M5 6 2.5 13a2.8 2.8 0 0 0 5 0L5 6ZM19 6l-2.5 7a2.8 2.8 0 0 0 5 0L19 6Z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" />
    </>
  ),
  heart: <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
  bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />,
  send: <path d="m21 3-9.5 9.5M21 3l-6.5 18-3-7.5L4 10.5 21 3Z" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.7 5.3-5.4" />
    </>
  ),
  code: <path d="m8 6-5 6 5 6M16 6l5 6-5 6M13.6 4l-3.2 16" />,
  binary: (
    <>
      <circle cx="7" cy="7" r="3.2" />
      <circle cx="17" cy="17" r="3.2" />
      <path d="M18.5 3v8M21 8.5 18.5 11 16 8.5M5.5 21v-8" />
    </>
  ),
  diff: (
    <>
      <rect x="3" y="4" width="8" height="16" rx="1.6" />
      <rect x="13" y="4" width="8" height="16" rx="1.6" />
      <path d="M5.4 8.5h3.2M5.4 12h3.2M15.4 8.5h3.2M15.4 15h3.2M15.4 11.5h3.2" />
    </>
  ),
  markdown: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.6" />
      <path d="M6 15.5V8.5l2.6 3 2.6-3v7M15 8.5v7m0 0 2.2-2.2M15 15.5l-2.2-2.2" />
    </>
  ),
  module: (
    <>
      <path d="M12 2.8 20.5 7.4v9.2L12 21.2 3.5 16.6V7.4L12 2.8Z" />
      <path d="m3.7 7.5 8.3 4.6 8.3-4.6M12 12.1v9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.4" />
      <circle cx="8.6" cy="9.4" r="1.6" />
      <path d="m4 17.2 4.9-4.9 3.8 3.8 2.7-2.7L20 18" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18V3Z" fill="currentColor" stroke="none" />
    </>
  ),
  gradient: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M4.2 15.6 15.6 4.2M8.4 20.2 20.2 8.4M3.4 11.4 11.4 3.4M12.6 20.6l8-8" />
    </>
  ),
  terminal: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2.4" />
      <path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.6" />
      <path d="M3 3.5v5.2h5.2M12 7.5V12l3.2 1.9" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}
