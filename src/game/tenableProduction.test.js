import { test } from 'node:test'
import assert from 'node:assert/strict'
import { challengeCatalogue, productionChallenges } from '../data/tenable/productionChallenges.js'
import { createTenableRound, guessTenable, matchTenableAnswer, normalizeAnswer, tenableBoard, tickTenable, validateChallenge } from './tenable.js'

const get = number => challengeCatalogue.find(c => c.number === number)
const guess = (number,input) => guessTenable(createTenableRound(get(number),1000),input,2000)

test('catalogue has the nine playable slots in order, three per difficulty, with a fixed cutoff', () => {
  assert.deepEqual(challengeCatalogue.map(c => c.number),[1,2,3,4,5,6,7,8,9])
  assert.equal(new Set(challengeCatalogue.map(c => c.id)).size,9)
  for (const difficulty of ['easy','medium','hard']) assert.equal(challengeCatalogue.filter(c => c.difficulty === difficulty).length,3)
  assert.deepEqual(productionChallenges.map(c => c.number),[1,2,3,4,5,6,7,8,9])
})

for (const challenge of challengeCatalogue) {
  test(`challenge ${challenge.number}: verified answers or a closed research gate`, () => {
    assert.equal(challenge.asOf,'2026-10-30')
    assert.equal(challenge.durationSeconds,60)
    assert.doesNotMatch(challenge.title,/TEST|fiktiv|øvelse/i)
    if (challenge.status === 'blocked') {
      assert.ok(challenge.verificationNote)
      assert.equal(challenge.answers,undefined)
      assert.throws(() => createTenableRound(challenge))
      return
    }
    validateChallenge(challenge)
    assert.ok(['verified','user-supplied'].includes(challenge.status))
    for (const [index,answer] of challenge.answers.entries()) {
      if(challenge.status === 'verified') assert.ok(answer.sources.length > 0)
      else assert.ok(challenge.provenance)
      assert.ok(answer.sources.every(source => /^https:\/\//.test(source)))
      if (answer.date) assert.ok(answer.date <= challenge.asOf)
      assert.deepEqual(matchTenableAnswer(challenge,answer.label),{kind:'correct',index})
      // Every explicit alias must resolve to the same answer or be explicitly ambiguous.
      for (const alias of answer.aliases) {
        const result = matchTenableAnswer(challenge,alias)
        assert.ok(result.kind === 'ambiguous' || result.index === index,alias)
      }
      const round = guessTenable(createTenableRound(challenge,1000),answer.label.toUpperCase(),2000)
      assert.deepEqual(round.found,[index])
      assert.equal(round.lives,3)
      assert.equal(guessTenable(round,answer.label,3000).found.length,1)
      assert.equal(guessTenable(round,answer.label,3000).lives,3)
      assert.equal(tenableBoard(round).length,10)
    }
    const round = createTenableRound(challenge,1000)
    assert.equal(tickTenable(round,60999).status,'playing')
    const late = guessTenable(round,challenge.answers[0].label,61000)
    assert.equal(late.status,'playing')
    assert.equal(late.found.length,0)
    assert.equal(late.lives,2)
    let completed = round
    for (const answer of challenge.answers.slice(-10)) completed = guessTenable(completed,answer.label,2000)
    assert.equal(completed.status,'won')
    assert.equal(completed.found.length,10)
  })
}

test('player names handle common spellings, international order, surnames and composed characters', () => {
  for (const value of ['elias olafsson','  ELÍAS   RAFN  ÓLAFSSON ','Ólafsson']) assert.equal(guess(1,value).found.length,1,value)
  for (const value of ['Djé Beni','Beni Junior','Han Beom Lee','lee','Gue Sung Cho','CHO','Hong Hyun Seok','Hong','Kjell Arik Watjen','Byskov','Kristensen','NK']) assert.equal(guess(1,value).found.length,1,value)
  for (const value of ['Loessl','Løssl','Lossl','Jonas Lössl','Juelsgaard','Kjaer','Morten Rasmussen','Duncan','Røll']) assert.equal(guess(6,value).found.length,1,value)
  assert.equal(normalizeAnswer('S\u030cIMŠIR'),normalizeAnswer('Şimşir'))
})

test('ambiguous surnames never select a player or lose a life, even after one candidate was found', () => {
  let round = guess(6,'Poulsen')
  assert.equal(round.lives,3)
  assert.equal(round.found.length,0)
  assert.match(round.feedback,/tvetydigt/)
  round = guessTenable(round,'Jakob Poulsen',3000)
  const ambiguous = guessTenable(round,'Poulsen',4000)
  assert.deepEqual(ambiguous.found,round.found)
  assert.equal(ambiguous.lives,3)
  assert.equal(guess(1,'Jensen').found.length,0)
  assert.equal(guess(1,'Jensen').lives,3)
})

test('every player and coach challenge accepts individual first, middle and last names without arbitrary choices', () => {
  for (const challenge of productionChallenges.filter(c => c.answers.every(answer => ['player','coach'].includes(answer.kind)))) {
    for (const [index,answer] of challenge.answers.entries()) {
      for (const name of [answer.label,...answer.aliases]) {
        for (const word of normalizeAnswer(name).split(' ')) {
          const result=matchTenableAnswer(challenge,word)
          assert.ok(result.kind === 'ambiguous' || result.index === index,`${challenge.number}: ${word} → ${answer.label}`)
        }
      }
    }
  }
  for (const number of [1,8]) {
    const friday=guess(number,'Friday')
    const etim=guess(number,'Etim')
    assert.equal(friday.found.length,1)
    assert.deepEqual(friday.found,etim.found)
    const duplicate=guessTenable(friday,'Etim',3000)
    assert.equal(duplicate.found.length,1)
    assert.equal(duplicate.lives,3)
    assert.equal(duplicate.remaining,60)
  }
  assert.equal(guess(1,'Rafn').found.length,1)
  assert.equal(guess(6,'Bybjerg').found.length,1)
  assert.equal(guess(9,'Asp').found.length,1)
  assert.equal(guess(6,'Morten').found.length,0)
  assert.equal(guess(6,'Morten').lives,3)
  assert.equal(guess(4,'Frank').found[0],7)
  for(const wrong of ['Frida','Eti','Friday ekstra']) assert.equal(guess(1,wrong).lives,2)
  assert.equal(guess(3,'Manchester').lives,3)
})

test('club identities accept common variants and keep unrelated clubs and future opponents out', () => {
  for (const value of ['Man Utd','Manchester United','S.S. Lazio','Sporting Lissabon','Glasgow Rangers','TNS','STVV','Bohemians Dublin','Fehervar','Røde Stjerne Beograd','Progres Niederkorn']) assert.equal(guess(3,value).found.length,1,value)
  for (const value of ['FCK','FC København','Copenhagen','Pafos','Hajduk Split','Real Madrid','Celtik','Lazio ekstra','NK Varaždin']) {
    assert.equal(guess(3,value).found.length,0,value)
    assert.equal(guess(3,value).lives,2,value)
  }
  let round = guess(3,'Man Utd')
  round = guessTenable(round,'Manchester United',3000)
  assert.equal(round.found.length,1)
  assert.equal(round.lives,3)
})

test('open answer pools fill ten slots in guess order, including answers beyond index nine', () => {
  let round = createTenableRound(get(1),1000)
  assert.equal(round.challenge.answers.length,32)
  assert.ok(tenableBoard(round).every(slot => slot.answer === null))
  round = guessTenable(round,'Frederik Vestergaard',2000)
  assert.equal(tenableBoard(round)[0].answer.label,'Frederik Vestergaard')
  assert.equal(tenableBoard(round).filter(slot => slot.answer).length,1)
  for (const input of ['forkert','forkert','forkert']) round = guessTenable(round,input,3000)
  assert.equal(round.status,'lost')
  assert.equal(tenableBoard(round).length,10)
  assert.equal(new Set(tenableBoard(round).map(slot => slot.index)).size,10)
  assert.equal(tenableBoard(round)[0].answer.label,'Frederik Vestergaard')
})

test('unsupported near matches, substitutes without appearances and youth-only internationals stay wrong', () => {
  for (const value of ['Mark Ugboh','Ovie Ejeheri','Mikel Gogorza','Junior Brumado','Kjell Watje','Billing ekstra','Phil Billing']) assert.equal(guess(1,value).lives,2,value)
  for (const value of ['Mads Albæk','Jesper Hansen','Victor Bak','Mads Bech Sørensen','Michael Hansen','Viktor Fischer','Christian Eriksen']) assert.equal(guess(6,value).lives,2,value)
})

test('FCK list is derived from latest distinct goals including the cup final, with minute tie-breaking', () => {
  assert.deepEqual(get(8).answers.map(a => a.label),['Denil Castillo','Friday Etim','Lee Han-beom','Victor Bak Jensen','Aral Şimşir','Franculino Djú','Oliver Sørensen','Adam Buksa','Ousmane Diao','Mikel Gogorza'])
  const goals = get(8).matchLedger.flatMap(match => match.goals.map(goal => ({...goal,date:match.date})))
    .sort((a,b) => b.date.localeCompare(a.date) || b.minute-a.minute)
  const distinct = [...new Map(goals.map(goal => [goal.label,null])).keys()].slice(0,10)
  assert.deepEqual(get(8).answers.map(a => a.label),distinct)
  assert.equal(get(8).answers[2].date,'2026-05-14')
  assert.equal(guess(8,'Darío Osorio').lives,2)
})

test('Top 5 list includes academy sales and excludes loans, indirect sales and second-tier buyers', () => {
  const challenge = get(9)
  assert.equal(challenge.answers[0].label,'Malik Pimpong')
  assert.equal(challenge.answers.at(-1).label,'Andreas Poulsen')
  assert.ok(challenge.answers.some(a => a.label === 'Jonathan Asp Jensen'))
  for (const [index,answer] of challenge.answers.entries()) {
    assert.equal(answer.permanent,true)
    assert.ok(['Premier League','La Liga','Bundesliga','Serie A','Ligue 1'].includes(answer.league))
    if(index) assert.ok(challenge.answers[index-1].date >= answer.date)
  }
  for (const value of ['Darío Osorio','Raphael Onyedika','Dominick Drexler','Gustav Ørsøe Christensen','Paul Onuachu','Alexander Sørloth','Patrick Banggaard']) assert.equal(guess(9,value).lives,2,value)
})

test('country and club aliases use explicit identity variants without fuzzy guessing', () => {
  // Synthetic matcher fixture, no assertion of FCM nationality history.
  const answers = [['Danmark','Denmark'],['Tyskland','Germany'],['Sverige','Sweden'],['Norge','Norway'],['Finland'],['Island','Iceland'],['Brasilien','Brazil'],['Nigeria'],['Sydkorea','South Korea','Korea Republic'],['Holland','Nederlandene','Netherlands']]
    .map(([label,...aliases]) => ({label,aliases}))
  const challenge = {...get(1),id:'matcher-countries',answers}
  validateChallenge(challenge)
  let round = createTenableRound(challenge,1000)
  round = guessTenable(round,'DENMARK',2000)
  round = guessTenable(round,'Danmark',3000)
  assert.equal(round.found.length,1)
  assert.equal(round.lives,3)
  assert.equal(guessTenable(round,'Denmar',4000).lives,2)
  assert.equal(matchTenableAnswer(challenge,'Nederlandene').index,9)
  assert.equal(matchTenableAnswer(challenge,'Korea Republic').index,8)
})

test('user-supplied sales ranking retains the requested order and converts every fee to DKK', () => {
  const challenge=get(4)
  assert.equal(challenge.status,'user-supplied')
  assert.match(challenge.provenance,/brugeren/)
  assert.deepEqual(challenge.answers.map(answer=>answer.label),['Darío Osorio','Franculino Djú','Alexander Sørloth','Aral Şimşir','Ousmane Diomande','Gustav Isaksen','Artem Dovbyk','Frank Onyeka','Jens-Lys Cajuste','Evander'])
  assert.deepEqual(challenge.answers.map(answer=>answer.feeDkk),[223800000,186500000,119360000,111900000,111900000,104440000,82060000,74600000,74600000,70870000])
  assert.equal(challenge.answers[0].buyer,'Crystal Palace')
  assert.equal(guess(4,'Dario Osorio').found[0],0)
  assert.equal(guess(4,'Franculino').found[0],1)
  assert.equal(guess(4,'Jens Cajuste').found[0],8)
  assert.equal(guess(4,'Raphael Onyedika').lives,2)
})

test('appearance records preserve the supplied Transfermarkt Apps, order and shared count', () => {
  const challenge=get(5)
  assert.equal(challenge.status,'user-supplied')
  assert.match(challenge.statisticDefinition,/Transfermarkt/)
  assert.deepEqual(challenge.answers.map(answer=>answer.label),['Erik Sviatchenko','Frank Kristensen','Jakob Poulsen','Kristian Bach Bak','Jonas Lössl','Rilwan Hassan','Joel Andersson','Mikkel Thygesen','Paulinho','Pione Sisto'])
  assert.deepEqual(challenge.answers.map(answer=>answer.appearances),[322,299,286,285,264,264,221,220,217,214])
  for(const [input,index] of [['Erik',0],['Sviatchenko',0],['Frank',1],['Kristensen',1],['Jakob',2],['Bach',3],['Bak',3],['Loessl',4],['Hassan',5],['Joel',6],['Thygesen',7],['Paulinho',8],['Pione',9]]) assert.equal(guess(5,input).found[0],index,input)
  const found=guess(5,'Jonas')
  const duplicate=guessTenable(found,'Loessl',3000)
  assert.equal(duplicate.found.length,1)
  assert.equal(duplicate.lives,3)
  assert.equal(guess(5,'Anders').found.length,0)
  assert.equal(guess(5,'Anders').lives,2)
  assert.equal(guess(5,'Jesper Mikkelsen').lives,2)
})


test('coach challenge accepts ten of fourteen unique head coaches, including caretakers', () => {
  const challenge = get(7)
  assert.equal(challenge.type,'any10')
  assert.equal(challenge.answers.length,14)
  assert.deepEqual(challenge.answers.map(a => a.label),['Mike Tullberg','Thomas Thomasberg','Albert Capellas','Henrik Jensen','Bo Henriksen','Brian Priske','Kenneth Andersen','Jess Thorup','Glen Riddersholm','Allan Kuhn','Erik Rasmussen','Jørn Aaes','Troels Bech','Ove Pedersen'])
  for (const value of ['Mike','Tullberg','Thomasberg','Henrik','Jensen','Priske','Joern','Jørn','Aaes','Riddersholm']) assert.equal(guess(7,value).found.length,1,value)
  let round=guess(7,'Thomas')
  round=guessTenable(round,'Thomasberg',3000)
  assert.equal(round.found.length,1)
  assert.equal(round.lives,3)
  for (const value of ['Lars Knudsen','Svend Graversen','Tullber','Priske ekstra']) assert.equal(guess(7,value).lives,2,value)
  let completed=createTenableRound(challenge,1000)
  for (const answer of challenge.answers.slice(4)) completed=guessTenable(completed,answer.label,2000)
  assert.equal(completed.status,'won')
  assert.equal(tenableBoard(completed).length,10)
})


test('open country challenge accepts countries from all three Transfermarkt pages', () => {
  const challenge=get(2)
  assert.equal(challenge.difficulty,'easy')
  assert.equal(challenge.type,'any10')
  assert.equal(challenge.answers.length,54)
  assert.equal(challenge.answers.filter(a=>a.sources[0].endsWith('/page/2')).length,25)
  assert.equal(challenge.answers.filter(a=>a.sources[0].endsWith('/page/3')).length,4)
  assert.ok(challenge.answers.every(a=>a.playerCount===undefined))
  let round=createTenableRound(challenge,1000)
  for (const value of ['Holland','Ivory Coast','South Korea','United States','Faroe Islands','Philippines','Northern Ireland','Democratic Republic of the Congo','The Gambia','Estonia']) round=guessTenable(round,value,2000)
  assert.equal(round.status,'won')
  assert.equal(tenableBoard(round).length,10)
  const first=guess(2,'Czechia')
  assert.equal(guessTenable(first,'Tjekkiet',3000).found.length,1)
  for (const value of ['Danmark','Denmark','Niger','Sverig','Czech','Japan','Frankrig','United Kingdom','Congo','Korea']) assert.equal(guess(2,value).lives,2,value)
  for (const [firstName,otherName] of [['Guinea','Guinea-Bissau'],['England','Nordirland']]) {
    const firstRound=guess(2,firstName)
    assert.equal(guessTenable(firstRound,otherName,3000).found.length,2)
  }
})


test('club name words accept unique identities and keep ambiguous names unresolved', () => {
  for (const value of ['Nottingham','Forest','Lazio','Bratislava','Hoffenheim','United']) assert.equal(guess(3,value).found.length,1,value)
  let round=guess(3,'Nottingham')
  round=guessTenable(round,'Forest',3000)
  assert.equal(round.found.length,1)
  assert.equal(round.lives,3)
  for (const value of ['Manchester','City']) {
    assert.equal(matchTenableAnswer(get(3),value).kind,'ambiguous',value)
    assert.equal(guess(3,value).lives,3,value)
    assert.equal(guess(3,value).found.length,0,value)
  }
  for (const value of ['FC','FK','SC','Notting','Fores','Forest ekstra']) assert.equal(guess(3,value).lives,2,value)
})
