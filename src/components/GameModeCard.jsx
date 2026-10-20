import Icon from './Icon'

export default function GameModeCard({ mode, onSelect }) {
  return <button className={`menu-mode menu-mode-${mode.id} ${mode.available ? 'menu-mode-playable' : 'menu-mode-locked'}`}
    disabled={!mode.available} onClick={() => onSelect(mode.id)}
    aria-label={`${mode.title} – ${mode.available ? 'Spil nu' : 'Kommer snart'}`}>
    <span className="menu-mode-copy">
      {mode.id === 'appearances' && <span className="menu-mode-type">Higher or Lower</span>}
      <span className="menu-mode-title">{mode.id === 'appearances' ? 'Flest kampe' : mode.title}</span>
      {mode.id === 'season' && <span className="menu-mode-subtitle">{mode.label}</span>}
      <span className="menu-mode-status"><Icon name={mode.available ? 'arrow' : 'lock'} />{mode.available ? 'Spil nu' : 'Kommer snart'}</span>
    </span>
    <span className="menu-mode-art" aria-hidden="true"><Icon name={mode.icon} /></span>
  </button>
}
