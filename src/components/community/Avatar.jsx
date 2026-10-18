import Icon from '../Icon'

export default function Avatar({ self = false }) {
  return <span className={`fan-avatar ${self ? 'fan-avatar-self' : ''}`} aria-hidden="true"><Icon name="user" /></span>
}
