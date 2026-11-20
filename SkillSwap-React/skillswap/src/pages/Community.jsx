import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import ToggleGroup from '../components/ToggleGroup.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { USERS } from '../data/users.js';
import { relativeTime } from '../utils/dates.js';
import './Community.css';

const TABS = [
  { value: 'All', label: 'All posts' },
  { value: 'Tip', label: 'Tips' },
  { value: 'Success story', label: 'Success stories' },
  { value: 'Question', label: 'Questions' },
];
const TYPE_CLASS = { Tip: 'tag tag-purple', 'Success story': 'tag tag-green', Question: 'tag tag-blue' };
const TRENDING = ['Photography', 'Spanish', 'Python', 'Sourdough', 'Figma', 'Guitar'];

function Post({ post }) {
  const { state, toggleLike, addReply, hidePost } = useApp();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const liked = state.likedPosts.includes(post.id);

  const submitReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    addReply(post.id, { author: state.profile.name, text: reply.trim() });
    setReply('');
  };

  return (
    <article className="card post lift">
      <div className="row-between">
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <Avatar name={post.author} palette={post.palette} src={post.mine ? state.profile.avatar : undefined} size={44} />
          <div className="stack" style={{ gap: 0 }}>
            <strong style={{ fontSize: 15 }}>{post.author}</strong>
            <span className="muted tiny">
              {post.swap} · {relativeTime(post.createdAt)}
            </span>
          </div>
        </div>
        <span className={TYPE_CLASS[post.type]}>{post.type}</span>
      </div>
      <h2>{post.title}</h2>
      <p className="post-body">{post.body}</p>
      {post.tags.length > 0 && (
        <div className="row" style={{ gap: 6 }}>
          {post.tags.map((t) => (
            <span key={t} className="chip chip-neutral">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="post-actions">
        <button type="button" className="btn btn-ghost like-btn" aria-pressed={liked} onClick={() => toggleLike(post.id)}>
          <Icon name="heart" size={18} fill={liked ? 'currentColor' : 'none'} />
          {post.likes + (liked ? 1 : 0)}
          <span className="sr-only">likes</span>
        </button>
        <button type="button" className="btn btn-ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="message" size={18} />
          {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
        </button>
        {!post.mine && (
          <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)' }} onClick={() => hidePost(post.id)}>
            <Icon name="flag" size={16} /> Report
          </button>
        )}
      </div>
      {open && (
        <div className="replies">
          {post.replies.length === 0 && <p className="muted small">No replies yet. Start the conversation!</p>}
          {post.replies.map((r, i) => (
            <div key={`${r.author}-${i}`} className="reply">
              <strong style={{ whiteSpace: 'nowrap' }}>{r.author}</strong>
              <span>{r.text}</span>
            </div>
          ))}
          <form className="row" style={{ gap: 8, flexWrap: 'nowrap' }} onSubmit={submitReply}>
            <label style={{ flex: '1 1 auto', display: 'flex' }}>
              <span className="sr-only">Write a reply</span>
              <input className="input" style={{ fontSize: 14, padding: '10px 12px' }} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={!reply.trim()}>
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Community() {
  useDocumentTitle('Community');
  const { state, addPost, toggleChallenge, notify } = useApp();
  const [tab, setTab] = useState('All');
  const [type, setType] = useState('Tip');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const posts = state.posts.filter((p) => !state.hiddenPosts.includes(p.id) && (tab === 'All' || p.type === tab));
  const topTeachers = [...USERS].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 3);
  const { profile } = state;

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      notify('Add a title and a few words before posting.', 'warning');
      return;
    }
    const skills = [...profile.teach, ...profile.learn].slice(0, 2).map((s) => s.name.replace(/\s+/g, ''));
    addPost({
      author: profile.name,
      palette: profile.palette,
      mine: true,
      swap: `${profile.teach[0]?.name || 'Learner'} ⇄ ${profile.learn[0]?.name || 'Anything'}`,
      type,
      title: title.trim(),
      body: body.trim(),
      tags: skills,
    });
    setTitle('');
    setBody('');
    setTab('All');
  };

  return (
    <div className="container page">
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="page-title">Community</h1>
        <p className="muted" style={{ fontSize: 17 }}>
          Tips, wins and questions from people learning together.
        </p>
      </div>

      <div className="split">
        <div className="main" style={{ gap: 20 }}>
          {/* Composer */}
          <form className="card composer" onSubmit={submit} aria-label="Create a post">
            <Avatar name={profile.name} palette={profile.palette} src={profile.avatar} size={44} />
            <div className="stack" style={{ flex: '1 1 auto', minWidth: 0, gap: 12 }}>
              <ToggleGroup label="Post type" options={TABS.slice(1)} value={type} onChange={setType} variant="round purple" />
              <label>
                <span className="sr-only">Title</span>
                <input className="input soft" placeholder="Give your post a title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} />
              </label>
              <label>
                <span className="sr-only">Share with the community</span>
                <textarea className="input soft" rows={3} placeholder="Share a tip, a win or a question…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} />
              </label>
              <div className="row-between">
                <span className="muted tiny">Posting as {profile.name.split(' ')[0]} · be kind and specific</span>
                <button type="submit" className="btn btn-primary">
                  Post
                </button>
              </div>
            </div>
          </form>

          <ToggleGroup label="Filter posts" options={TABS} value={tab} onChange={setTab} variant="round" />

          {posts.length === 0 && (
            <div className="empty">
              <strong>No posts here yet</strong>
              <p className="muted">Be the first to share one!</p>
            </div>
          )}
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>

        <aside className="side" style={{ gap: 20 }}>
          <section className="challenge">
            <span className="label-caps" style={{ fontSize: 12, color: '#E4E0FF' }}>
              This month&apos;s challenge
            </span>
            <strong style={{ fontSize: 20, lineHeight: 1.3 }}>Teach something in 15 minutes</strong>
            <p>Record a micro-lesson of your skill and post it here. The most helpful ones get featured on the homepage.</p>
            <button
              type="button"
              className="btn btn-white"
              style={{ alignSelf: 'flex-start', color: 'var(--purple-deep)' }}
              aria-pressed={state.challengeJoined}
              onClick={toggleChallenge}
            >
              {state.challengeJoined ? '✓ Joined — leave challenge' : 'Join challenge'}
            </button>
          </section>

          <section className="card stack" style={{ gap: 12, padding: 22 }}>
            <h2 style={{ fontSize: 18 }}>Trending skills</h2>
            <div className="row" style={{ gap: 8 }}>
              {TRENDING.map((skill, i) => (
                <Link key={skill} to={`/match?q=${encodeURIComponent(skill)}`} className={`chip chip-lg ${i % 2 ? 'tag-blue' : 'tag-purple'}`} style={{ textDecoration: 'none' }}>
                  {skill}
                </Link>
              ))}
            </div>
          </section>

          <section className="card stack" style={{ gap: 14, padding: 22 }}>
            <h2 style={{ fontSize: 18 }}>Top-rated teachers</h2>
            {topTeachers.map((u) => (
              <Link key={u.id} to={`/profile/${u.id}`} className="teacher-row">
                <Avatar name={u.name} palette={u.palette} size={40} />
                <span className="stack small" style={{ flex: '1 1 auto', gap: 0 }}>
                  <strong>{u.name}</strong>
                  <span className="muted">{u.teaches.map((s) => s.name).join(' · ')}</span>
                </span>
                <span className="small" style={{ fontWeight: 700 }}>
                  ★ {u.rating.toFixed(1)}
                </span>
              </Link>
            ))}
          </section>

          <section id="guidelines" className="card stack" style={{ gap: 12, padding: 22 }}>
            <h2 style={{ fontSize: 18 }}>Community guidelines</h2>
            <ul className="guidelines">
              <li>Swap fairly: give as much time as you receive.</li>
              <li>Be on time, and cancel early if plans change.</li>
              <li>Keep feedback kind, honest and specific.</li>
            </ul>
          </section>

          <section id="safety" className="card stack" style={{ gap: 12, padding: 22 }}>
            <h2 className="row" style={{ fontSize: 18, gap: 8 }}>
              <span style={{ color: 'var(--green)' }}>
                <Icon name="shield" size={20} />
              </span>
              Stay safe
            </h2>
            <ul className="guidelines">
              <li>Start with a video call before meeting in person.</li>
              <li>Meet in public places and tell a friend.</li>
              <li>Never share bank details. SkillSwap is always free.</li>
            </ul>
            <p className="muted tiny" style={{ lineHeight: 1.55 }}>
              Every profile, message and post has Report and Block options. We review reports within 24 hours.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
