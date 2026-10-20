import { useSyncExternalStore } from 'react'
import { authAccount } from '../services/authAccount.js'
export default function useAuthAccount(){return useSyncExternalStore(authAccount.subscribe,authAccount.getSnapshot,authAccount.getSnapshot)}
