import { useEffect, useState } from 'react'
import useProfilePhoto from '../../hooks/useProfilePhoto'
import Icon from '../Icon'
import useAuthAccount from '../../hooks/useAuthAccount.js'
import { profilePhotoPublicUrl } from '../../services/cloudProfilePhoto.js'
import { supabase } from '../../lib/supabase.js'

function OwnPhoto() {
  const { blob } = useProfilePhoto()
  const [image, setImage] = useState(null)
  const [failed, setFailed] = useState(null)
  useEffect(() => {
    if (!blob) return
    const next = URL.createObjectURL(blob)
    // The effect owns the URL lifetime, including React Strict Mode cleanup.
    // oxlint-disable-next-line react/set-state-in-effect
    setImage({blob,url:next})
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return blob && image?.blob===blob && failed !== image.url ? <img src={image.url} alt="" onError={() => setFailed(image.url)} /> : <Icon name="user" />
}
function CloudPhoto({ path }) {
  const url=profilePhotoPublicUrl(supabase,path)
  const [failed,setFailed]=useState(false)
  return url&&!failed?<img src={url} alt="" onError={()=>setFailed(true)} />:<Icon name="user" />
}
export default function Avatar({ self = false, localPhoto = false, avatarPath = null }) {
  const account=useAuthAccount()
  const path=avatarPath||(self&&account.status==='signed-in'?account.profile?.avatar_path:null)
  const showLocal=self&&account.status==='guest'&&(localPhoto||!avatarPath)
  return <span className={`fan-avatar ${self ? 'fan-avatar-self' : ''}`} aria-hidden="true">{path?<CloudPhoto key={path} path={path}/>:showLocal?<OwnPhoto/>:<Icon name="user"/>}</span>
}
