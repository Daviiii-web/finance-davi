import type { CSSProperties } from 'react';

const paths = {
  lock: 'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v11H4ZM12 14v3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  eyeOff: 'M3 3l18 18M10 5a11 11 0 0 1 2 0c6 0 10 7 10 7a20 20 0 0 1-3 4M6 6a20 20 0 0 0-4 6s4 7 10 7a11 11 0 0 0 5-1M10 10a3 3 0 0 0 4 4',
  logout: 'M9 4H4v16h5M9 12h12m-4-4 4 4-4 4',
  check: 'm5 12 4 4L19 6',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  moon: 'M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z',
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  arrows: 'M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4',
  chart: 'M4 3v17h17M8 15v-4m5 4V7m5 8V4',
  wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7m0 5h-5v5h5',
  plus: 'M12 5v14M5 12h14',
  up: 'M7 17 17 7M7 7h10v10',
  down: 'M7 7 17 17M7 17h10V7',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  calendar: 'M8 2v4m8-4v4M3 9h18M3 4h18v17H3Z',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6',
  leaf: 'M20 3C7 1 2 7 5 14s15 6 15-11ZM4 21 15 10',
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
