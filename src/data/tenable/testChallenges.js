// Synthetic TEST data only. Array order gives ranks, newest first for latest10.
const answer = (label, ...aliases) => ({ label, aliases })
export const testChallenges = [
  { id:'test-numbers', title:'TEST · Tal fra 1 til 10', difficulty:'easy', type:'top10', description:'TEST: Gæt tallene et til ti, rangeret i stigende talorden. Ingen FCM-statistik.', answers:['et','to','tre','fire','fem','seks','syv','otte','ni','ti'].map((name,i) => answer(name,String(i+1),...(i === 0 ? ['en']:[]))) },
  { id:'test-players', title:'TEST · Det fiktive hold', difficulty:'medium', type:'top10', description:'TEST: Ti fiktive spillere: Testspiller A til Testspiller J. A er øverst. Du kan også skrive “Spiller A”.', answers:'ABCDEFGHIJ'.split('').map(letter => answer(`Testspiller ${letter}`,`Spiller ${letter}`)) },
  { id:'test-opponents', title:'TEST · Fiktive modstandere', difficulty:'hard', type:'latest10', description:'TEST: Ti opdigtede modstandere: Testklub 10 til Testklub 1, nyeste først. Skriv fx “Testklub 10” eller “Klub 10”.', answers:Array.from({length:10},(_,i) => answer(`Testklub ${10-i}`,`Klub ${10-i}`)) },
].map(c => ({ ...c, isTest:true, durationSeconds:60, source:'TEST · Syntetiske data. Ingen historiske FCM-resultater.' }))
