// Password policy belongs to Supabase, not a duplicated frontend length constant.
// Only stable codes/reasons (or tightly matched legacy length messages) are mapped.
// Never display a raw server response, which may include private information.
export function passwordError(error, fallback) {
  const reasons=Array.isArray(error?.reasons)?error.reasons:[]
  if(reasons.includes('length') || reasons.includes('min_length') ||
    (['weak_password','validation_failed'].includes(error?.code) && /^Password should be at least \d+ characters\.?$/i.test(error.message||''))) {
    return 'Adgangskoden er for kort. Vælg en længere adgangskode.'
  }
  if(reasons.includes('pwned'))return 'Denne adgangskode er kendt fra et datalæk. Vælg en anden adgangskode.'
  if(error?.code==='weak_password')return 'Vælg en stærkere adgangskode, gerne en længere sætning.'
  return fallback
}
