import { Route, Routes } from 'react-router-dom';
import { AppLayout, MarketingLayout } from './components/layout/Layouts.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Toasts from './components/Toasts.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import Match from './pages/Match.jsx';
import Profile from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Messages from './pages/Messages.jsx';
import Sessions from './pages/Sessions.jsx';
import Community from './pages/Community.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/match" element={<Match />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/community" element={<Community />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  );
}
