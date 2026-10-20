import Icon from './Icon'

export default function GameModeCard({ mode, onSelect }) {
  return <button className={`menu-mode menu-mode-${mode.id} ${mode.available ? 'menu-mode-playable' : 'menu-mode-locked'}`}
    disabled={!mode.available} onClick={() => onSelect(mode.id)}
    aria-label={`${mode.title} – ${mode.available ? 'Spil nu' : 'Kommer snart'}`}>
    <span className="menu-mode-copy">
      <span className="menu-mode-title">{mode.title}</span>
      {mode.id === 'season' && <span className="menu-mode-subtitle">{mode.label}</span>}
      <span className="menu-mode-status"><Icon name={mode.available ? 'arrow' : 'lock'} />{mode.available ? 'Spil nu' : 'Kommer snart'}</span>
    </span>
    <span className="menu-mode-art" aria-hidden="true"><Icon name={mode.icon} /></span>
  </button>
}
