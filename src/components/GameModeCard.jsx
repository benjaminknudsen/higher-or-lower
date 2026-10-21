import Icon from './Icon'

const cardHeadings = {
  appearances: { type: 'Higher or Lower', title: 'Flest kampe' },
  tenable: { type: 'FCM Tenable', title: 'Gæt alle 10' },
}

export default function GameModeCard({ mode, onSelect }) {
  const heading = cardHeadings[mode.id]
  return <button className={`menu-mode menu-mode-${mode.id} ${mode.available ? 'menu-mode-playable' : 'menu-mode-locked'}`}
    disabled={!mode.available} onClick={() => onSelect(mode.id)}
    aria-label={`${mode.title} – ${mode.available ? 'Spil nu' : 'Kommer snart'}`}>
    <span className="menu-mode-copy">
      {heading && <span className="menu-mode-type">{heading.type}</span>}
      <span className="menu-mode-title">{heading?.title ?? mode.title}</span>
      {mode.id === 'season' && <span className="menu-mode-subtitle">{mode.label}</span>}
      <span className="menu-mode-status"><Icon name={mode.available ? 'arrow' : 'lock'} />{mode.available ? 'Spil nu' : 'Kommer snart'}</span>
    </span>
    <span className="menu-mode-art" aria-hidden="true"><Icon name={mode.icon} /></span>
  </button>
}
