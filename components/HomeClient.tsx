'use client';

import { useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, Search, ListMusic, Heart, Trash2, Download, Menu, X, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Playlist, PlaylistTrack, Track } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

type Section = { title: string; items: Track[] };

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [query, setQuery] = useState('');
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, PlaylistTrack[]>>({});
  const [showAuth, setShowAuth] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [queueOpen, setQueueOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const current = currentIndex >= 0 ? queue[currentIndex] : null;

  useEffect(() => {
    loadTrending();
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadPlaylists();
    else {
      setPlaylists([]);
      setPlaylistTracks({});
    }
  }, [user]);

  async function loadTrending() {
    setLoading(true);
    const res = await fetch('/api/trending');
    const data = await res.json();
    setSections(data.sections || []);
    setLoading(false);
  }

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  async function loadPlaylists() {
    if (!user) return;
    const { data: lists } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false });

    setPlaylists((lists || []) as Playlist[]);

    const { data: tracks } = await supabase
      .from('playlist_tracks')
      .select('*')
      .order('position', { ascending: true });

    const grouped: Record<string, PlaylistTrack[]> = {};
    (tracks || []).forEach((track: any) => {
      grouped[track.playlist_id] ||= [];
      grouped[track.playlist_id].push(track);
    });
    setPlaylistTracks(grouped);
  }

  async function createPlaylist() {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const name = prompt('Nom de la playlist ?');
    if (!name?.trim()) return;
    await supabase.from('playlists').insert({ name: name.trim(), user_id: user.id });
    await loadPlaylists();
  }

  async function addToPlaylist(track: Track, playlistId?: string) {
    if (!user) {
      setShowAuth(true);
      return;
    }

    let target = playlistId;
    if (!target) {
      if (!playlists.length) {
        const name = prompt('Nom de la nouvelle playlist ?') || 'Ma playlist';
        const { data } = await supabase
          .from('playlists')
          .insert({ name, user_id: user.id })
          .select()
          .single();
        target = data?.id;
      } else {
        const menu = playlists.map((p, index) => `${index + 1}. ${p.name}`).join('\n');
        const choice = prompt(`Choisis une playlist :\n${menu}\n\nNuméro ?`) || '1';
        target = playlists[Math.max(0, Number(choice) - 1)]?.id || playlists[0].id;
      }
    }

    if (!target) return;
    const currentTracks = playlistTracks[target] || [];
    await supabase.from('playlist_tracks').insert({
      playlist_id: target,
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      source_url: track.sourceUrl,
      position: currentTracks.length
    });
    await loadPlaylists();
  }

  async function deletePlaylist(id: string) {
    if (!confirm('Supprimer cette playlist ?')) return;
    await supabase.from('playlists').delete().eq('id', id);
    await loadPlaylists();
  }

  function playTrack(track: Track, list?: Track[]) {
    const nextQueue = list?.length ? list : [track];
    const index = Math.max(0, nextQueue.findIndex(t => t.id === track.id));
    setQueue(nextQueue);
    setCurrentIndex(index);
  }

  function addToQueue(track: Track) {
    setQueue(q => [...q, track]);
    if (currentIndex < 0) setCurrentIndex(0);
  }

  function playPlaylist(id: string) {
    const tracks = (playlistTracks[id] || []).map(t => ({
      id: t.track_id,
      title: t.title,
      artist: t.artist,
      thumbnail: t.thumbnail,
      sourceUrl: t.source_url
    }));
    if (!tracks.length) return;
    setQueue(tracks);
    setCurrentIndex(0);
  }

  function moveQueue(from: number, to: number) {
    if (to < 0 || to >= queue.length || from === to) return;
    const currentTrack = current;
    const copy = [...queue];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setQueue(copy);
    if (currentTrack) setCurrentIndex(copy.findIndex(t => t.id === currentTrack.id));
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null) return;
    moveQueue(dragIndex, targetIndex);
    setDragIndex(null);
  }

  function next() {
    if (currentIndex + 1 < queue.length) setCurrentIndex(currentIndex + 1);
  }

  function previous() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  const playerSrc = current
    ? `https://www.youtube.com/embed/${current.id}?autoplay=1&playsinline=1&rel=0`
    : '';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_-10%,rgba(29,185,84,.22),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,.06),transparent_28%)]" />

      <div className="relative grid min-h-screen gap-3 p-3 pb-32 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]/80 shadow-2xl backdrop-blur-xl">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/5 bg-[#101010]/88 p-4 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/logo.png" alt="MusicSimple" className="h-12 w-12 rounded-2xl object-cover" />
              <div>
                <h1 className="text-xl font-black leading-none tracking-tight">MusicSimple</h1>
                <p className="text-xs text-zinc-400">Compte, playlists, streaming</p>
              </div>
            </div>

            <button onClick={() => setQueueOpen(!queueOpen)} className="rounded-full bg-white/10 px-4 py-3 font-black hover:bg-white/15 lg:hidden">
              <ListMusic className="inline h-4 w-4" /> File {queue.length}
            </button>

            <form onSubmit={doSearch} className="order-last flex min-w-full flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/5 transition focus-within:ring-simple-green/50 sm:order-none sm:min-w-[280px]">
              <Search className="h-4 w-4 text-simple-green" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Chercher un titre, artiste, album..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500" />
              <button className="rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:scale-105">Chercher</button>
            </form>

            <button onClick={createPlaylist} className="rounded-full bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15">
              <Plus className="inline h-4 w-4" /> Playlist
            </button>

            <button onClick={() => user ? supabase.auth.signOut() : setShowAuth(true)} className="rounded-full bg-simple-green px-4 py-3 text-sm font-black text-black transition hover:scale-105">
              {user ? <><LogOut className="inline h-4 w-4" /> Quitter</> : 'Connexion'}
            </button>
          </header>

          <div className="space-y-8 p-4 sm:p-6">
            <section className="animate-rise">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <span className="rounded-full border border-simple-green/30 bg-simple-green/10 px-3 py-2 text-xs font-black text-simple-green">MusicSimple Cloud</span>
                  <h2 className="mt-4 text-5xl font-black tracking-[-.07em] sm:text-7xl">Ta musique.</h2>
                  <p className="mt-2 max-w-2xl text-zinc-400">Recherche, écoute, crée un compte et sauvegarde tes playlists comme sur une plateforme de streaming.</p>
                </div>
                <button onClick={() => sections[0]?.items?.[0] && playTrack(sections[0].items[0], sections[0].items)} className="rounded-full bg-simple-green px-6 py-4 font-black text-black transition hover:scale-105">
                  ▶ Lancer les tendances
                </button>
              </div>
            </section>

            {results.length > 0 && (
              <TrackSection title={`Résultats pour "${query}"`} tracks={results} onPlay={playTrack} onQueue={addToQueue} onSave={addToPlaylist} />
            )}

            {loading && <SkeletonSection />}

            {!loading && sections.map(section => (
              <TrackSection key={section.title} title={section.title} tracks={section.items} onPlay={(track) => playTrack(track, section.items)} onQueue={addToQueue} onSave={addToPlaylist} />
            ))}

            {showLibrary && (
              <Library playlists={playlists} playlistTracks={playlistTracks} onPlay={playPlaylist} onDelete={deletePlaylist} onCreate={createPlaylist} />
            )}
          </div>
        </section>

        <aside className={`${queueOpen ? 'fixed inset-x-3 bottom-28 top-24 z-40 lg:static lg:z-auto' : 'hidden lg:block'} overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]/95 p-5 shadow-2xl backdrop-blur-xl`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight">File d’attente</h2>
              <p className="text-sm text-zinc-400">Glisse pour réorganiser.</p>
            </div>
            <button onClick={() => setQueueOpen(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/15"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-2 overflow-auto pr-1 max-h-[calc(100vh-210px)]">
            {!queue.length && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">Ajoute des titres ou lance une tendance.</div>}
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={`group grid cursor-grab grid-cols-[46px_1fr_auto] items-center gap-3 rounded-2xl border p-2 transition ${i === currentIndex ? 'border-simple-green/40 bg-simple-green/10' : 'border-transparent bg-white/[.045] hover:bg-white/[.075]'} ${dragIndex !== null && dragIndex !== i ? 'hover:border-simple-green/50 hover:translate-x-1' : ''}`}
              >
                <img src={track.thumbnail} alt="" className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{track.title}</p>
                  <p className="truncate text-xs text-zinc-400">{i === currentIndex ? 'En lecture' : 'À venir'} • {track.artist}</p>
                </div>
                <button onClick={() => setCurrentIndex(i)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black opacity-0 transition group-hover:opacity-100">Lire</button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Player current={current} src={playerSrc} onNext={next} onPrevious={previous} onQueue={() => setQueueOpen(true)} onLibrary={() => setShowLibrary(!showLibrary)} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  );
}

function TrackSection({ title, tracks, onPlay, onQueue, onSave }: {
  title: string;
  tracks: Track[];
  onPlay: (track: Track) => void;
  onQueue: (track: Track) => void;
  onSave: (track: Track) => void;
}) {
  return (
    <section className="animate-rise">
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        <span className="text-xs text-zinc-400">{tracks.length} titres</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tracks.map(track => (
          <article key={track.id} className="group rounded-3xl bg-[#181818] p-3 transition hover:-translate-y-1 hover:bg-[#242424]">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={track.thumbnail} alt="" className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
              <button onClick={() => onPlay(track)} className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-simple-green text-black opacity-100 shadow-xl transition hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100">▶</button>
            </div>
            <h4 className="mt-3 line-clamp-2 text-sm font-black">{track.title}</h4>
            <p className="mt-1 truncate text-xs text-zinc-400">{track.artist}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => onQueue(track)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15">File</button>
              <button onClick={() => onSave(track)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"><Save className="inline h-3 w-3" /> Save</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Player({ current, src, onNext, onPrevious, onQueue, onLibrary }: {
  current: Track | null;
  src: string;
  onNext: () => void;
  onPrevious: () => void;
  onQueue: () => void;
  onLibrary: () => void;
}) {
  return (
    <footer className="fixed inset-x-3 bottom-3 z-50 grid min-h-[96px] grid-cols-1 items-center gap-3 rounded-[26px] border border-simple-green/25 bg-black/92 p-3 shadow-glow backdrop-blur-xl lg:grid-cols-[1fr_1.3fr_1fr]">
      <div className="flex min-w-0 items-center gap-3">
        <img src={current?.thumbnail || '/logo.png'} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        <div className="min-w-0">
          <p className="truncate font-black">{current?.title || 'Aucun titre'}</p>
          <p className="truncate text-sm text-zinc-400">{current?.artist || 'Choisis une musique'}</p>
          <span className="mt-1 inline-flex rounded-full bg-simple-green px-2 py-1 text-[10px] font-black text-black">MusicSimple</span>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-center gap-4">
          <button onClick={onPrevious} className="rounded-full bg-white/10 p-3 hover:bg-white/15">⏮</button>
          <button className="grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-black text-black transition hover:scale-105">▶</button>
          <button onClick={onNext} className="rounded-full bg-white/10 p-3 hover:bg-white/15">⏭</button>
        </div>
        <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 text-xs text-zinc-400">
          <span>0:00</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-1/3 rounded-full bg-simple-green" /></div>
          <span>3:03</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={onLibrary} className="rounded-full bg-white/10 px-4 py-3 font-black hover:bg-white/15">Bibliothèque</button>
        <button onClick={onQueue} className="rounded-full bg-white/10 px-4 py-3 font-black hover:bg-white/15"><ListMusic className="inline h-4 w-4" /> File</button>
        {current && <a href={current.sourceUrl} target="_blank" className="rounded-full bg-white/10 p-3 hover:bg-white/15"><Download className="h-5 w-5" /></a>}
      </div>

      {src && (
        <iframe
          title="YouTube player"
          src={src}
          className="absolute bottom-[105px] right-3 hidden h-[80px] w-[142px] rounded-2xl border border-white/10 lg:block"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </footer>
  );
}

function SkeletonSection() {
  return (
    <section>
      <div className="mb-4 h-8 w-72 rounded-full bg-white/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-3xl bg-[#181818] p-3">
            <div className="aspect-square rounded-2xl bg-white/10" />
            <div className="mt-3 h-4 rounded-full bg-white/10" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-white/10" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Library({ playlists, playlistTracks, onPlay, onDelete, onCreate }: {
  playlists: Playlist[];
  playlistTracks: Record<string, PlaylistTrack[]>;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black">Ta bibliothèque</h3>
        <button onClick={onCreate} className="rounded-full bg-simple-green px-4 py-2 font-black text-black"><Plus className="inline h-4 w-4" /> Créer</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map(list => (
          <div key={list.id} className="rounded-3xl bg-[#181818] p-4">
            <p className="font-black">{list.name}</p>
            <p className="text-sm text-zinc-400">{playlistTracks[list.id]?.length || 0} titres</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => onPlay(list.id)} className="rounded-full bg-simple-green px-4 py-2 font-black text-black">Lire</button>
              <button onClick={() => onDelete(list.id)} className="rounded-full bg-white/10 px-3 py-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      alert('Supabase n’est pas configuré. Remplis les variables Vercel.');
      return;
    }
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) alert(result.error.message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-xl">
      <form onSubmit={submit} className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#121212] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-black">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2"><X /></button>
        </div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="mb-3 w-full rounded-2xl bg-white/10 px-4 py-4 outline-none ring-simple-green/40 focus:ring" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="mb-4 w-full rounded-2xl bg-white/10 px-4 py-4 outline-none ring-simple-green/40 focus:ring" />
        <button className="w-full rounded-full bg-simple-green py-4 font-black text-black">{mode === 'login' ? 'Se connecter' : 'Créer le compte'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-4 w-full text-sm text-zinc-400 hover:text-white">
          {mode === 'login' ? 'Pas encore de compte ? Inscription' : 'Déjà un compte ? Connexion'}
        </button>
      </form>
    </div>
  );
}
