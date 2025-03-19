-- 04_rls_policies.sql
-- RLS(Row Level Security) 정책 정의

-- users 테이블에 대한 RLS 정책

-- 모든 사용자는 모든 사용자 정보를 조회할 수 있음 (공개 프로필)
DROP POLICY IF EXISTS "사용자 조회 가능" ON users;
CREATE POLICY "사용자 조회 가능" ON users 
  FOR SELECT USING (true);

-- 사용자는 자신의 정보만 수정 가능
DROP POLICY IF EXISTS "사용자 자신의 정보만 수정 가능" ON users;
CREATE POLICY "사용자 자신의 정보만 수정 가능" ON users 
  FOR UPDATE USING (auth.uid()::text = clerk_id);

-- rooms 테이블에 대한 RLS 정책

-- 방 조회는 누구나 가능
DROP POLICY IF EXISTS "방 조회 가능" ON rooms;
CREATE POLICY "방 조회 가능" ON rooms 
  FOR SELECT USING (true);

-- 방 생성은 인증된 사용자만 가능
DROP POLICY IF EXISTS "방 생성 가능" ON rooms;
CREATE POLICY "방 생성 가능" ON rooms 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND host_id = id
  ));

-- 방 수정은 방 주인만 가능
DROP POLICY IF EXISTS "방 주인만 수정 가능" ON rooms;
CREATE POLICY "방 주인만 수정 가능" ON rooms 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = rooms.host_id
    )
  );

-- 방 삭제는 방 주인만 가능
DROP POLICY IF EXISTS "방 주인만 삭제 가능" ON rooms;
CREATE POLICY "방 주인만 삭제 가능" ON rooms 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = rooms.host_id
    )
  );

-- room_users 테이블에 대한 RLS 정책

-- 방 참여자 조회는 누구나 가능
DROP POLICY IF EXISTS "방 참여자 조회 가능" ON room_users;
CREATE POLICY "방 참여자 조회 가능" ON room_users 
  FOR SELECT USING (true);

-- 방 참여는 인증된 사용자만 가능
DROP POLICY IF EXISTS "방 참여 가능" ON room_users;
CREATE POLICY "방 참여 가능" ON room_users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = room_users.user_id
    )
  );

-- 방 참여 정보 수정은 본인만 가능
DROP POLICY IF EXISTS "방 참여 정보 본인만 수정 가능" ON room_users;
CREATE POLICY "방 참여 정보 본인만 수정 가능" ON room_users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = room_users.user_id
    )
  );

-- videos 테이블에 대한 RLS 정책

-- 비디오 조회는 누구나 가능
DROP POLICY IF EXISTS "비디오 조회 가능" ON videos;
CREATE POLICY "비디오 조회 가능" ON videos 
  FOR SELECT USING (true);

-- 비디오 추가는 인증된 사용자만 가능
DROP POLICY IF EXISTS "비디오 추가 가능" ON videos;
CREATE POLICY "비디오 추가 가능" ON videos 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = videos.added_by
    )
  );

-- playlists 테이블에 대한 RLS 정책

-- 본인 플레이리스트 및 방 플레이리스트 조회 가능
DROP POLICY IF EXISTS "플레이리스트 조회 가능" ON playlists;
CREATE POLICY "플레이리스트 조회 가능" ON playlists
  FOR SELECT USING (
    room_id IS NOT NULL OR 
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = playlists.user_id
    ))
  );

-- 플레이리스트 추가는 인증된 사용자만 가능
DROP POLICY IF EXISTS "플레이리스트 추가 가능" ON playlists;
CREATE POLICY "플레이리스트 추가 가능" ON playlists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = playlists.user_id
    ) OR (
      room_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM rooms r
        JOIN users u ON r.host_id = u.id
        WHERE r.id = playlists.room_id AND u.clerk_id = auth.uid()::text
      )
    )
  );

-- playlist_videos 테이블에 대한 RLS 정책

-- 플레이리스트 비디오 조회는 누구나 가능
DROP POLICY IF EXISTS "플레이리스트 비디오 조회 가능" ON playlist_videos;
CREATE POLICY "플레이리스트 비디오 조회 가능" ON playlist_videos 
  FOR SELECT USING (true);

-- 본인 플레이리스트에만 비디오 추가 가능
DROP POLICY IF EXISTS "본인 플레이리스트에만 비디오 추가 가능" ON playlist_videos;
CREATE POLICY "본인 플레이리스트에만 비디오 추가 가능" ON playlist_videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = playlist_videos.playlist_id AND u.clerk_id = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM playlists p
      JOIN rooms r ON p.room_id = r.id
      JOIN users u ON r.host_id = u.id
      WHERE p.id = playlist_videos.playlist_id AND u.clerk_id = auth.uid()::text
    )
  );

-- watch_history 테이블에 대한 RLS 정책

-- 본인 시청 기록만 조회 가능
DROP POLICY IF EXISTS "본인 시청 기록만 조회 가능" ON watch_history;
CREATE POLICY "본인 시청 기록만 조회 가능" ON watch_history 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = watch_history.user_id
    )
  );

-- 본인 시청 기록만 추가 가능
DROP POLICY IF EXISTS "본인 시청 기록만 추가 가능" ON watch_history;
CREATE POLICY "본인 시청 기록만 추가 가능" ON watch_history 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE clerk_id = auth.uid()::text AND id = watch_history.user_id
    )
  ); 