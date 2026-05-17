import type { NavIconName } from '../types/navigation';

interface NavIconProps {
  name: NavIconName;
  active?: boolean;
}

export function NavIcon({ name, active = false }: NavIconProps) {
  const strokeWidth = active ? 2.4 : 2;

  if (name === 'history') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 8.9"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 5v4h4M12 7.5V12l3 1.8"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          d="M18.4 13.5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-2.6-1.5L13 2.5h-4l-.4 2.6A7.8 7.8 0 0 0 6 6.6l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0-.1 1.5 7.7 7.7 0 0 0 .1 1.5l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 2.6 1.5L9 21.5h4l.4-2.6a7.8 7.8 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M8.5 7h7M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

