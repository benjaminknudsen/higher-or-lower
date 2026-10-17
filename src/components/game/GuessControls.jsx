function GameArrow({ down = false }) {
  return <svg className={`game-answer-arrow ${down ? 'arrow-down' : ''}`} viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
    <path className="arrow-depth" d="m18 5 13 14h-9v9l-8 5V19H5Z" fill="currentColor" opacity=".2" />
    <path d="M17 2 29 16h-8v11l-8 5V16H5Z" fill="currentColor" />
    <path d="m6 23-3 4m25-4-3 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="m17 7 5 6" stroke="var(--arrow-highlight)" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
}

export default function GuessControls({ locked, guess, onGuess, unit = 'mål', playerName = '' }) {
  return <div className="guess-buttons" role="group" aria-label={`Dit svar for ${playerName}`}>
    <button className={`guess-button guess-higher ${guess === 'higher' ? 'was-chosen' : ''}`} aria-label={`${playerName}: Højere – flere ${unit}`} disabled={locked} onClick={() => onGuess('higher')}>
      <span className="zone-label"><span className="guess-arrow" aria-hidden="true"><GameArrow /></span> HØJERE</span>
    </button>
    <button className={`guess-button guess-lower ${guess === 'lower' ? 'was-chosen' : ''}`} aria-label={`${playerName}: Lavere – færre ${unit}`} disabled={locked} onClick={() => onGuess('lower')}>
      <span className="zone-label"><span className="guess-arrow" aria-hidden="true"><GameArrow down /></span> LAVERE</span>
    </button>
  </div>
}
