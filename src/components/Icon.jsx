export default function Icon({ name, className = '' }) {
  const paths = {
    share: <><path d="M12 16V3m-4 4 4-4 4 4M7 10H4v11h16V10h-3" /></>,
    install: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M12 6v9m-3-3 3 3 3-3m-4 7h2" /></>,
    camera: <><path d="M8 5l2-2h4l2 2h4a2 2 0 0 1 2 2v12H2V7a2 2 0 0 1 2-2h4Z" /><circle cx="12" cy="12" r="4" /></>,
    beer: <><path d="M5 8h11v12H5V8Zm11 2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3M8 11v6m5-6v6" /><path d="M5 8a3 3 0 0 1 0-6 3 3 0 0 1 5-1 3 3 0 0 1 5 2 3 3 0 0 1 1 5" /></>,
    pitch: <><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M4 12h16M8 2v4h8V2M8 22v-4h8v4" /><circle cx="12" cy="12" r="3" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m12 12 8-8m-4 0h4v4" /></>,
    home: <><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M9 20v-7h6v7" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    edit: <><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    ball: <><circle cx="12" cy="12" r="9" /><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V3m5 8 4-2m-6 8 2 3m-8-3-2 3m0-9L3 9" /></>,
    shirt: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c0 4-8 4-8 0Z" />,
    transfer: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" /></>,
    trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 2v6m-5 1h10" /></>,
    chevrons: <><path d="m7 9 5-5 5 5M7 15l5 5 5-5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.ball}</svg>
}
