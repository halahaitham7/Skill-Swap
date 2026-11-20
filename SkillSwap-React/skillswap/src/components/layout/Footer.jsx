import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="stack" style={{ flex: '1 1 280px', maxWidth: 360, gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>SkillSwap</span>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
            Learn, teach &amp; grow together. A community where knowledge is the currency.
          </p>
        </div>
        <div className="footer-cols">
          <div>
            <strong>Platform</strong>
            <Link to="/match">Find partners</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/sessions">Sessions</Link>
          </div>
          <div>
            <strong>Community</strong>
            <Link to="/community">Tips &amp; stories</Link>
            <Link to="/community#guidelines">Guidelines</Link>
          </div>
          <div>
            <strong>Safety</strong>
            <Link to="/community#safety">Safety tips</Link>
            <Link to="/dashboard#blocked">Blocked members</Link>
          </div>
        </div>
      </div>
      <div className="container muted tiny" style={{ paddingBottom: 32 }}>
        © {new Date().getFullYear()} SkillSwap
      </div>
    </footer>
  );
}
