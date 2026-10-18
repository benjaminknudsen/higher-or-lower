import Icon from './Icon'

const destinations = [
  { id: 'home', href: '#forside', icon: 'home', label: 'Forside' },
  { id: 'leaderboard', href: '#leaderboard', icon: 'trophy', label: 'Leaderboard' },
  { id: 'profile', href: '#profil', icon: 'user', label: 'Profil' },
]

export default function BottomNavigation({ active }) {
  return <nav className="bottom-navigation" aria-label="Hovednavigation">
    {destinations.map(item => <a key={item.id} href={item.href} aria-current={active === item.id ? 'page' : undefined}>
      <Icon name={item.icon} /><span>{item.label}</span>
    </a>)}
  </nav>
}
