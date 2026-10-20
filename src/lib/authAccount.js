import { canonicalUsername } from './accountPolicy.js'

export function createAuthAccount(client, service, recoveryStorage) {
  let state = { status:'loading', userId:null, profile:null, profileError:'', error:'', notice:'', syncNotice:'', mode:null, recovery:false }
  const listeners=new Set()
  const recoveryKey='fcm.auth.recovery.v1'
  function storedRecovery(){try{return recoveryStorage?.getItem(recoveryKey)}catch{return null}}
  function saveRecovery(id){try{if(id)recoveryStorage?.setItem(recoveryKey,id);else recoveryStorage?.removeItem(recoveryKey)}catch{/* Recovery can still finish in memory. */}}
  let generation=0, lifecycle=0, active=false, unsubscribe=()=>{}
  const emit=patch=>{ state={...state,...patch};listeners.forEach(fn=>fn()) }
  async function accept(session, event) {
    const version=++generation, id=session?.user?.id ?? null
    const recovery=!!id&&(event==='PASSWORD_RECOVERY' || (state.recovery && state.userId===id) || storedRecovery()===id)
    if(recovery)saveRecovery(id)
    else if(!id)saveRecovery(null)
    emit({status:id?'signed-in':'guest',userId:id,profile:state.userId===id?state.profile:null,profileError:'',syncNotice:'',recovery:!!id&&recovery,...(id?{mode:recovery?'password':null}:{})})
    if(!id || !client) return
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),8000)
    try {
      let query=client.from('profiles').select('id,username,avatar_path').eq('id',id)
      if(query.abortSignal)query=query.abortSignal(controller.signal)
      const {data,error}=await query.single()
      if(!active || version!==generation) return
      emit(error||!data ? {profile:null,profileError:'Profilen kunne ikke hentes. Kontrollér forbindelsen, og prøv igen.'} : {profile:data})
    } catch {
      if(active && version===generation)emit({profile:null,profileError:'Profilen kunne ikke hentes. Prøv igen, når du er online.'})
    } finally {clearTimeout(timeout)}
  }
  return {
    getSnapshot:()=>state,
    subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},
    start() {
      active=true
      const run=++lifecycle
      let eventReceived=false
      unsubscribe=service.subscribe((event,session)=>{eventReceived=true;queueMicrotask(()=>{if(active&&run===lifecycle)void accept(session,event)})})
      void service.getSession().then(result=>{if(active&&run===lifecycle&&!eventReceived)void accept(result.ok?result.data?.session:null)})
      return ()=>{active=false;lifecycle++;generation++;unsubscribe()}
    },
    open:mode=>emit({mode,error:'',notice:''}), close:()=>emit({mode:null,error:''}),
    async callback(location, history) {
      const url=new URL(location.href), code=url.searchParams.get('code')
      const fragment=new URLSearchParams(url.hash.slice(1))
      const authFragment=['error','error_code','access_token','refresh_token'].some(key=>fragment.has(key))
      const failed=url.searchParams.has('error')||url.searchParams.has('error_code')||authFragment
      if(!code&&!failed)return
      if(authFragment)url.hash=''
      for(const name of ['code','error','error_code','error_description'])url.searchParams.delete(name)
      history.replaceState(history.state,'',url.pathname+url.search+url.hash)
      if(failed){emit({mode:'login',error:'Linket er ugyldigt eller udløbet. Bed om et nyt link.'});return true}
      const result=await service.exchangeCode(code)
      if(!result.ok)emit({mode:'login',error:result.message})
      return true
    },
    async changeUsername(value) {
      const username=canonicalUsername(value), id=state.userId
      if(!id||!username)return {ok:false,message:'Brug 3–24 bogstaver (a–z), tal eller underscore.'}
      try {
        const {data,error}=await client.from('profiles').update({username}).eq('id',id).select('id,username,avatar_path').single()
        if(error||!data)return {ok:false,message:error?.code==='23505'?'Brugernavnet er optaget. Vælg et andet.':'Brugernavnet kunne ikke gemmes. Prøv igen.'}
        if(state.userId===id)emit({profile:data,profileError:''})
        return {ok:true}
      } catch{return {ok:false,message:'Ingen forbindelse. Prøv igen.'}}
    },
    retryProfile:()=>accept(state.userId?{user:{id:state.userId}}:null),
    setAvatarPath(userId, path) {
      if (!userId || state.userId !== userId || !state.profile || (path !== null && typeof path !== 'string')) return false
      emit({ profile: { ...state.profile, avatar_path: path } })
      return true
    },
    setSyncNotice(message) {
      if (state.syncNotice !== message) emit({ syncNotice: message })
    },
    finishRecovery:()=>{saveRecovery(null);emit({recovery:false,mode:'login',notice:'Adgangskoden er ændret. Log ind med den nye adgangskode.'})},
  }
}
