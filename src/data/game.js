export const clubs = {
  fcm: { id: 'fcm', name: 'FC Midtjylland', shortName: 'FCM', nickname: 'Ulvene', accent: '#ed2939' },
}

export const gameModes = [
  { id: 'appearances', title: 'Flest kampe', label: 'Kampe for klubben', description: 'Hvem har flest FCM-kampe registreret hos Transfermarkt?', icon: 'shirt', implemented: true, featured: true, statisticKey: 'appearances', unit: 'kampe' },
  { id: 'goals', title: 'Flest mål', label: 'Mål gennem historien', description: 'Sammenlign spillernes mål for FC Midtjylland.', icon: 'ball', implemented: true, statisticKey: 'goals', unit: 'mål' },
  { id: 'transfers', title: 'Højeste transfersum', label: 'Klubbens spillersalg', description: 'Sammenlign transfersummer fra klubbens spillersalg.', icon: 'transfer', available: false, statisticKey: 'transferFee', unit: '€' },
  { id: 'season', title: 'Bedste sæson', label: 'Mål og assists', description: 'Sammenlign mål og assists i spillernes bedste sæson.', icon: 'trophy', available: false, statisticKey: 'seasonGoalContributions', unit: 'mål + assists' },
]
