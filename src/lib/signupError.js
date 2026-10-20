import { passwordError } from './passwordError.js'

// Auth does not reliably expose a trigger's SQLSTATE/constraint to the browser.
// Never infer a taken username from a generic 500 or render raw server messages.
export function signupError(error) {
  switch (error?.code) {
    case 'weak_password':
      return passwordError(error, 'Vælg en stærkere adgangskode.')
    case 'validation_failed':
      return passwordError(error, 'Oplysningerne kunne ikke godkendes. Kontrollér dem, og prøv igen.')
    case 'email_address_invalid':
      return 'E-mailadressen er ugyldig. Kontrollér adressen.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Der er sendt for mange anmodninger. Vent lidt, og prøv igen.'
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Oprettelse af konti er ikke tilgængelig lige nu.'
    default:
      return 'Kontoen kunne ikke oprettes. Kontrollér oplysningerne, og prøv eventuelt et andet brugernavn. Hvis fejlen fortsætter, kan der være et teknisk problem.'
  }
}
