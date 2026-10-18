export default function CommunityHeader({ title, subtitle }) {
  return <header className="community-header">
    <span className="community-wordmark">FCM <span>Higher or Lower</span></span>
    <h1 id="page-title" tabIndex={-1}>{title}</h1>
    <p>{subtitle}</p>
  </header>
}
