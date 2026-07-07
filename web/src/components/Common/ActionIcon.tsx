import React from 'react';

type ActionIconName =
  | 'add'
  | 'edit'
  | 'save'
  | 'delete'
  | 'search'
  | 'clear'
  | 'cancel'
  | 'confirm'
  | 'upload'
  | 'replace'
  | 'logout'
  | 'back'
  | 'next'
  | 'prev'
  | 'rating'
  | 'state'
  | 'details';

interface ActionIconProps {
  name: ActionIconName;
  className?: string;
  ariaHidden?: boolean;
}

const ICONS: Record<ActionIconName, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M3 21h6" /><path d="m14.5 3.5 6 6" /><path d="M5 19l2.5-7.5L17 2l5 5-9.5 9.5L5 19z" /></>,
  save: <><path d="M5 21h14V7l-3-3H5z" /><path d="M9 21v-6h6v6" /><path d="M9 4v5h6" /></>,
  delete: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 10v7M14 10v7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  clear: <path d="m6 6 12 12M18 6 6 18" />,
  cancel: <path d="M6 12h12M6 12l4-4M6 12l4 4" />,
  confirm: <path d="m5 13 4 4L19 7" />,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
  replace: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M20 12a8 8 0 0 0-14-5" /><path d="M4 12a8 8 0 0 0 14 5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  back: <path d="m15 18-6-6 6-6" />,
  next: <path d="m9 18 6-6-6-6" />,
  prev: <path d="m15 18-6-6 6-6" />,
  rating: <path d="m12 3 2.9 6 6.6 1-4.8 4.7 1.2 6.6L12 18.4 6.1 21.3l1.2-6.6L2.5 10l6.6-1z" />,
  state: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20" /><path d="M6.5 7H20V21H6.5A2.5 2.5 0 0 1 4 18.5z" /></>,
  details: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
};

export const ActionIcon: React.FC<ActionIconProps> = ({
  name,
  className = '',
  ariaHidden = true,
}) => {
  const icon = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`action-icon ${className}`.trim()}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      {icon}
    </svg>
  );
};
