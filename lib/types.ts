export type Track = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  sourceUrl: string;
};

export type Playlist = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
};

export type PlaylistTrack = {
  id: string;
  playlist_id: string;
  track_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  source_url: string;
  position: number;
  created_at: string;
};
