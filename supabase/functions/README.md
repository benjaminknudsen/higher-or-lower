# Fremtidige Edge Functions

Ingen handlers er implementeret eller deployet. Supabase Auth håndterer signup,
e-mail-login, logout, sessionshåndtering og e-mailbaseret password-reset direkte.
Der skal ikke bygges egne password- eller recovery-endpoints.

Senere kan Edge Functions validere afsluttede spilrunder, importere lokal historik
transaktionelt og behandle avatarer. De skal validere bruger/ejerskab, have rate
limits og holde service credentials på serveren. Privat importschema må ikke
publiceres gennem Data API. Ingen statistik synkroniseres i denne fase.
