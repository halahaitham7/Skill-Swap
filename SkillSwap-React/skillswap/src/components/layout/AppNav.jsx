import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../Logo.jsx';
import Icon from '../Icon.jsx';
import Avatar from '../Avatar.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { relativeTime } from '../../utils/dates.js';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/match', label: 'Find partners' },
  { to: '/messages', label: 'Messages' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/community', label: 'Community' },
];

/** Closes a dropdown when clicking outside of it or pressing Escape. */
function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close]);
}

export default function AppNav() {
  const { state, markNotificationRead, markAllNotificationsRead, resetDemo } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useRef(null);
  const userRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useDismiss(bellRef, bellOpen, () => setBellOpen(false));
  useDismiss(userRef, userOpen, () => setUserOpen(false));

  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  const unreadNotes = state.notifications.filter((n) => !n.read).length;
  const unreadMessages = Object.values(state.unread).reduce((a, b) => a + b, 0);

  const openNotification = (n) => {
    markNotificationRead(n.id);
    setBellOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <header className="site-header">
      <nav aria-label="App" className="container nav">
        <Logo size={36} />
        <div id="app-links" className={`nav-links${menuOpen ? ' open' : ''}`}>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {link.label}
              {link.to === '/messages' && unreadMessages > 0 && (
                <span className="count-badge" style={{ marginLeft: 6 }} aria-label={`${unreadMessages} unread`}>
                  {unreadMessages}
                </span>
              )}
            </NavLink>
          ))}
        </div>
        <div className="nav-actions">
          <div className="dropdown" ref={bellRef}>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Notifications${unreadNotes ? `, ${unreadNotes} new` : ''}`}
              aria-expanded={bellOpen}
              onClick={() => {
                setBellOpen((o) => !o);
                setUserOpen(false);
              }}
            >
              <Icon name="bell" size={22} />
              {unreadNotes > 0 && <span className="dot-badge">{unreadNotes}</span>}
            </button>
            {bellOpen && (
              <div className="dropdown-panel" role="menu" aria-label="Notifications">
                <div className="dropdown-head">
                  <strong>Notifications</strong>
                  <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: '6px 10px', fontSize: 13 }} onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                </div>
                {state.notifications.length === 0 && <p className="muted small" style={{ padding: 10 }}>You're all caught up.</p>}
                {state.notifications.slice(0, 8).map((n) => (
                  <button key={n.id} type="button" role="menuitem" className={`dropdown-item${n.read ? '' : ' unread'}`} onClick={() => openNotification(n)}>
                    {!n.read ? <span className="unread-dot" aria-hidden="true" /> : <span style={{ width: 8, flex: 'none' }} />}
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{n.text}</span>
                      <span className="muted tiny" style={{ fontWeight: 500 }}>
                        {relativeTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown" ref={userRef}>
            <button
              type="button"
              className="user-button"
              aria-label="Account menu"
              aria-expanded={userOpen}
              onClick={() => {
                setUserOpen((o) => !o);
                setBellOpen(false);
              }}
            >
              <Avatar name={state.profile.name} palette={state.profile.palette} src={state.profile.avatar} size={40} />
            </button>
            {userOpen && (
              <div className="dropdown-panel" role="menu" aria-label="Account" style={{ width: 240 }}>
                <div className="dropdown-head" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <strong>{state.profile.name}</strong>
                  <span className="muted tiny">{state.profile.location || 'Location not set'}</span>
                </div>
                <Link role="menuitem" className="dropdown-item" to="/signup">
                  <Icon name="pen" size={18} /> Edit profile
                </Link>
                <Link role="menuitem" className="dropdown-item" to="/dashboard#favorites">
                  <Icon name="heart" size={18} /> Favorites
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  onClick={() => {
                    resetDemo();
                    setUserOpen(false);
                  }}
                >
                  <Icon name="refresh" size={18} /> Reset demo data
                </button>
                <Link role="menuitem" className="dropdown-item" to="/">
                  <Icon name="logout" size={18} /> Log out
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-btn nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="app-links"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </nav>
    </header>
  );
}
