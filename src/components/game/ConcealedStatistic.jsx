import './ConcealedStatistic.css'

export default function ConcealedStatistic({ value, unit, hidden, animate = true }) {
  return <strong className={`concealed-statistic ${hidden ? 'is-concealed' : 'is-revealed'}`} aria-label={hidden ? `Antal ${unit} skjult` : `${value} ${unit}`}>
    {hidden ? <span className="concealed-statistic-bars" aria-hidden="true">
      <i /><i /><i />
    </span> : <span className={`concealed-statistic-number ${animate ? 'statistic-number-reveal' : ''} ${String(value).length >= 3 ? 'statistic-three-digits' : ''}`} aria-hidden="true">{value}</span>}
  </strong>
}
