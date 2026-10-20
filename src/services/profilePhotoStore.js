// Auth loading is not a guest identity: never flash a previous profile's photo.
export function profilePhotoOwner(account) {
  if(account.status==='guest')return 'guest'
  if(account.status==='signed-in'&&account.userId)return `user:${account.userId}`
  return null
}

// Each owner has independent hydration, state, listeners and a serialized write
// queue. Callbacks capture their store, so a late upload cannot change accounts.
export function createProfilePhotoStores(repositoryForOwner) {
  const stores=new Map()
  return function forOwner(owner) {
    if(stores.has(owner))return stores.get(owner)
    let snapshot={blob:null,loading:!!owner,error:''}, hydration, writes=Promise.resolve()
    const listeners=new Set()
    const publish=next=>{snapshot=next;listeners.forEach(fn=>fn())}
    const repository=()=>repositoryForOwner(owner)
    function hydrate(){
      if(!owner)return Promise.resolve()
      if(!hydration)hydration=repository().load().then(blob=>publish({blob:blob instanceof Blob?blob:null,loading:false,error:''})).catch(()=>publish({blob:null,loading:false,error:'Dit profilbillede kunne ikke hentes fra denne enhed.'}))
      return hydration
    }
    function save(blob){
      if(!owner)return Promise.reject(new Error('Vent, til din profil er indlæst.'))
      const operation=writes.then(async()=>{
        await hydrate()
        try {
          if(blob)await repository().save(blob)
          else await repository().remove()
          publish({blob,loading:false,error:''})
        }catch{throw new Error('Billedet kunne ikke gemmes. Kontrollér browserens lagring og ledige plads.')}
      })
      writes=operation.catch(()=>{})
      return operation
    }
    const store={getSnapshot:()=>snapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},hydrate,save,remove:()=>save(null)}
    stores.set(owner,store)
    return store
  }
}
