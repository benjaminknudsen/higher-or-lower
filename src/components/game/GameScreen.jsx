import { useMemo } from 'react'
import { getVerifiedPlayers } from '../../data/quality'
import GameSession from './GameSession'

export default function GameScreen({ club, mode, dataset, onRestart }) {
  const players = useMemo(() => getVerifiedPlayers(dataset, club.id, mode.statisticKey), [dataset, club.id, mode.statisticKey])
  const dataNotice = players.length >= 2
    ? 'Transfermarkts FCM-kampe · Competition: Total'
    : 'Afventer verificerede Transfermarkt-tal · Competition: Total.'

  return <GameSession key={`${club.id}-${mode.id}`} club={club} mode={mode} players={players} dataNotice={dataNotice} onRestart={onRestart} />
}
