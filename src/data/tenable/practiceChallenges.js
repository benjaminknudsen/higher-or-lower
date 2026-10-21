// Curated practice lists, not historical rankings. The array defines reveal order.
const answer = value => {
  const [label, ...aliases] = Array.isArray(value) ? value : [value]
  return { label, aliases }
}
const challenge = (id, title, difficulty, description, answers) => ({
  id, title, difficulty, type:'top10', durationSeconds:300,
  description:`${description} Ti udvalgte svar i redaktionel rækkefølge – ikke en statistisk rangliste.`,
  answers:answers.map(answer), source:'FCM Games · Redaktionelt sammensat øvelsesliste. Ingen historisk FCM-statistik.',
})
export const practiceChallenges = [
  challenge('football-kit','Klar til kamp','easy','Gæt ti ting i fodboldtasken eller til spillerens kampudstyr.',[
    ['Fodboldstøvler','støvler'],['Benskinner','skinnebensbeskyttere'],['Fodboldstrømper','strømper'],['Spilletrøje','trøje','fodboldtrøje'],['Shorts','fodboldshorts'],['Målmandshandsker','handsker'],['Drikkedunk','vandflaske'],['Sportstape','tape'],['Træningsdragt','overtræksdragt'],['Sportstaske','fodboldtaske'],
  ]),
  challenge('football-pitch','Rundt på banen','easy','Find ti markeringer og områder på en fodboldbane.',[
    ['Midtercirkel','midtercirklen'],['Midterlinje','midterlinjen'],['Midterplet','midterpletten'],['Sidelinje','sidelinjen'],['Mållinje','mållinjen'],['Straffesparksfelt','straffesparksfeltet'],['Målfelt','målfeltet'],['Straffesparksplet','straffesparkspletten'],['Hjørnefelt','hjørnefeltet','hjørnebue'],['Straffesparksbue','straffesparksbuen'],
  ]),
  challenge('football-match','Kampens øjeblikke','easy','Gæt ti udvalgte hændelser og igangsættelser fra en fodboldkamp.',[
    ['Mål','scoring'],['Indkast','indkastet'],['Hjørnespark','hjørne'],['Frispark','frisparket'],['Straffespark','straffe'],['Målspark','målsparket'],['Offside','offsiden'],['Gult kort','advarsel'],['Rødt kort','udvisning'],['Udskiftning','indskiftning'],
  ]),
  challenge('football-positions','Find din position','medium','Find ti udvalgte positioner og spillerroller.',[
    ['Målmand','keeper'],['Højre back','højreback'],['Venstre back','venstreback'],['Midterforsvarer','centerback','midterforsvar'],['Libero','sweeper'],['Defensiv midtbane','defensiv midtbanespiller'],['Central midtbane','central midtbanespiller'],['Offensiv midtbane','offensiv midtbanespiller'],['Kantspiller','winger'],['Angriber','forward'],
  ]),
  challenge('football-technique','Bolden ved fødderne','medium','Find ti udvalgte teknikker og boldaktioner.',[
    ['Dribling','drible'],['Aflevering','pasning'],['Tæmning','førsteberøring'],['Indlæg','cross'],['Hovedstød','header'],['Flugtning','volley'],['Halvflugtning','halvvolley'],['Hælaflevering','hælpasning'],['Stikning','stikningsbold'],['Chip','chipbold'],
  ]),
  challenge('football-training','På træningsbanen','medium','Gæt ti udvalgte træningsøvelser og træningsformer.',[
    ['Opvarmning','varme op'],['Rondo','firkant'],['Intervaltræning','intervaller'],['Sprinttræning','sprint'],['Afslutningstræning','afslutninger'],['Pasningsøvelse','pasningsøvelser'],['Småspil','småbanespil'],['Styrketræning','styrke'],['Balancetræning','balance'],['Udstrækning','strækøvelser'],
  ]),
  challenge('football-tactics','Taktiktavlen','hard','Find ti udvalgte taktiske begreber og spillestile.',[
    ['Gegenpres','genpres','counterpressing'],['Højt pres','high press'],['Lav blok','low block'],['Omstilling','omstilling'],['Overlap','overlapløb'],['Underlap','underlapløb'],['Mandsopdækning','mandsmarkering'],['Zoneopdækning','zonemarkering'],['Offsidefælde','offsidefælden'],['Positionsspil','positional play'],
  ]),
  challenge('football-formations','Ti formationer','hard','Find formationerne 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2, 5-4-1, 4-1-4-1, 4-5-1 og 4-3-1-2. Bindestreger eller mellemrum accepteres.',[
    ['4-4-2','4 4 2','442'],['4-3-3','4 3 3','433'],['4-2-3-1','4 2 3 1','4231'],['3-5-2','3 5 2','352'],['3-4-3','3 4 3','343'],['5-3-2','5 3 2','532'],['5-4-1','5 4 1','541'],['4-1-4-1','4 1 4 1','4141'],['4-5-1','4 5 1','451'],['4-3-1-2','4 3 1 2','4312'],
  ]),
  challenge('football-specialists','Specialisterne','hard','Gæt ti udvalgte specialistroller. Tænk blandt andet på niere, backs og midtbaneprofiler.',[
    ['Falsk nier','falsk 9','falsk 9er'],['Targetman','target man'],['Inverteret back','inverted fullback'],['Wingback','wing back'],['Box-to-box','box to box','box-to-box midtbane'],['Dyb playmaker','deep lying playmaker'],['Skyggeangriber','shadow striker'],['Sweeperkeeper','sweeper keeper'],['Inverteret kant','inverted winger'],['Regista','registaen'],
  ]),
]
