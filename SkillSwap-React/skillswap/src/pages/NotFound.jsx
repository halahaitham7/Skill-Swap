import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container page">
      <div className="empty" style={{ padding: '64px 24px' }}>
        <span className="logo-mark" style={{ width: 56, height: 56, borderRadius: 16 }}>
          <Icon name="swap" size={30} strokeWidth={2.2} />
        </span>
        <h1 style={{ fontSize: 28 }}>We couldn&apos;t find that page</h1>
        <p className="muted">The link may be broken, or the page may have moved.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-soft" to="/">
            Go home
          </Link>
          <Link className="btn btn-primary" to="/match">
            Find partners
          </Link>
        </div>
      </div>
    </div>
  );
}
