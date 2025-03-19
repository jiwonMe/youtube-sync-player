-- 01_init_schema.sql
-- 초기 데이터베이스 스키마 정의

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  settings JSONB
);

-- 방 테이블 생성
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  video_control_permission TEXT DEFAULT 'host-only' NOT NULL
  CHECK (video_control_permission IN ('host-only', 'all-users'))
);

-- 방 사용자 관계 테이블 생성
CREATE TABLE IF NOT EXISTS room_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  is_host BOOLEAN DEFAULT false NOT NULL,
  UNIQUE (room_id, user_id)
);

-- 비디오 테이블 생성
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (youtube_id)
);

-- 플레이리스트 테이블 생성
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- 플레이리스트는 방 또는 사용자에 속해야 함
  CHECK ((room_id IS NOT NULL AND user_id IS NULL) OR (room_id IS NULL AND user_id IS NOT NULL))
);

-- 플레이리스트 비디오 관계 테이블 생성
CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (playlist_id, position)
);

-- 시청 기록 테이블 생성
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  watch_duration INTEGER NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_rooms_name ON rooms (name);
CREATE INDEX idx_rooms_host_id ON rooms (host_id);
CREATE INDEX idx_room_users_room_id ON room_users (room_id);
CREATE INDEX idx_room_users_user_id ON room_users (user_id);
CREATE INDEX idx_videos_youtube_id ON videos (youtube_id);
CREATE INDEX idx_playlists_room_id ON playlists (room_id);
CREATE INDEX idx_playlists_user_id ON playlists (user_id);
CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos (playlist_id);
CREATE INDEX idx_watch_history_user_id ON watch_history (user_id);
CREATE INDEX idx_watch_history_video_id ON watch_history (video_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- 트리거 함수 생성: 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON playlists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 