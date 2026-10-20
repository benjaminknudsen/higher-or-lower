export const clubs = {
  fcm: { id: 'fcm', name: 'FC Midtjylland', shortName: 'FCM', nickname: 'Ulvene', accent: '#ed2939' },
}

export const gameModes = [
  { id: 'lineup', title: 'Gæt startopstillingen', label: 'Find kampens 11 startere', description: '3 minutter. 3 fejl. Kan du huske de 11?', icon: 'pitch', implemented: true },
  { id: 'appearances', title: 'Flest kampe', label: 'Kampe for klubben', description: 'Hvem har flest FCM-kampe registreret hos Transfermarkt?', icon: 'shirt', implemented: true, featured: true, statisticKey: 'appearances', unit: 'kampe' },
  { id: 'goals', title: 'Flest mål', label: 'Mål gennem historien', description: 'Sammenlign spillernes mål for FC Midtjylland.', icon: 'ball', implemented: true, statisticKey: 'goals', unit: 'mål' },
  { id: 'transfers', title: 'Højeste transfersum', label: 'Klubbens spillersalg', description: 'Sammenlign transfersummer fra klubbens spillersalg.', icon: 'transfer', available: false, statisticKey: 'transferFee', unit: '€' },
  { id: 'season', title: 'Drukspil', label: 'Saml flokken til FCM-hygge', description: 'Saml flokken til FCM-hygge.', icon: 'beer', available: false, statisticKey: 'seasonGoalContributions', unit: 'mål + assists' },
]
