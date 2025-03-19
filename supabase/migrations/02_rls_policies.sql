-- 02_rls_policies.sql
-- RLS(Row Level Security) 정책 설정

-- 서비스 계정은 모든 정책을 우회하도록 허용하는 정책
CREATE POLICY "Service role has full access"
ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON rooms FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON room_users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON videos FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON playlists FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON playlist_videos FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access"
ON watch_history FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 사용자 테이블 정책
CREATE POLICY "사용자는 자신의 정보만 읽을 수 있음"
ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "사용자는 자신의 정보만 업데이트할 수 있음"
ON users FOR UPDATE USING (id = auth.uid());

-- 방 테이블 정책
CREATE POLICY "모든 사용자는 활성화된 방을 볼 수 있음"
ON rooms FOR SELECT USING (is_active = true);

CREATE POLICY "방 생성자만 방을 업데이트할 수 있음"
ON rooms FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "방 생성자만 방을 삭제할 수 있음"
ON rooms FOR DELETE USING (host_id = auth.uid());

CREATE POLICY "모든 인증된 사용자는 방을 생성할 수 있음"
ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 방 사용자 관계 테이블 정책
CREATE POLICY "사용자는 자신이 참여한 방의 사용자 목록을 볼 수 있음"
ON room_users FOR SELECT USING (
  room_id IN (
    SELECT room_id FROM room_users 
    WHERE user_id = auth.uid() AND left_at IS NULL
  ) OR user_id = auth.uid()
);

CREATE POLICY "사용자는 자신의 방 참여 기록만 추가할 수 있음"
ON room_users FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "사용자는 자신의 방 참여 기록만 업데이트할 수 있음"
ON room_users FOR UPDATE USING (user_id = auth.uid());

-- 비디오 테이블 정책
CREATE POLICY "모든 사용자는 비디오를 볼 수 있음"
ON videos FOR SELECT USING (true);

CREATE POLICY "인증된 사용자는 비디오를 추가할 수 있음"
ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND added_by = auth.uid());

CREATE POLICY "영상 추가자만 영상 정보를 수정할 수 있음"
ON videos FOR UPDATE USING (added_by = auth.uid());

-- 플레이리스트 테이블 정책
CREATE POLICY "사용자는 자신의 플레이리스트를 볼 수 있음"
ON playlists FOR SELECT USING (
  user_id = auth.uid() OR
  room_id IN (
    SELECT room_id FROM room_users 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

CREATE POLICY "사용자는 자신의 플레이리스트를 생성할 수 있음"
ON playlists FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  (room_id IS NOT NULL AND room_id IN (
    SELECT room_id FROM room_users 
    WHERE user_id = auth.uid() AND is_host = true
  ))
);

CREATE POLICY "사용자는 자신의 플레이리스트를 수정할 수 있음"
ON playlists FOR UPDATE USING (
  user_id = auth.uid() OR
  (room_id IS NOT NULL AND room_id IN (
    SELECT room_id FROM room_users 
    WHERE user_id = auth.uid() AND is_host = true
  ))
);

CREATE POLICY "사용자는 자신의 플레이리스트를 삭제할 수 있음"
ON playlists FOR DELETE USING (
  user_id = auth.uid() OR
  (room_id IS NOT NULL AND room_id IN (
    SELECT room_id FROM room_users 
    WHERE user_id = auth.uid() AND is_host = true
  ))
);

-- 플레이리스트 비디오 관계 테이블 정책
CREATE POLICY "사용자는 자신의 플레이리스트에 속한 비디오를 볼 수 있음"
ON playlist_videos FOR SELECT USING (
  playlist_id IN (
    SELECT id FROM playlists
    WHERE user_id = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_users 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  )
);

CREATE POLICY "사용자는 자신의 플레이리스트에 비디오를 추가할 수 있음"
ON playlist_videos FOR INSERT WITH CHECK (
  playlist_id IN (
    SELECT id FROM playlists
    WHERE user_id = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_users 
      WHERE user_id = auth.uid() AND (is_host = true OR (
        -- 방 호스트가 아니더라도 모든 사용자에게 비디오 컨트롤 권한이 있는 방은 허용
        SELECT video_control_permission FROM rooms
        WHERE id = (SELECT room_id FROM playlists WHERE id = playlist_id)
      ) = 'all-users')
    )
  )
);

CREATE POLICY "사용자는 자신의 플레이리스트의 비디오를 수정할 수 있음"
ON playlist_videos FOR UPDATE USING (
  playlist_id IN (
    SELECT id FROM playlists
    WHERE user_id = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_users 
      WHERE user_id = auth.uid() AND (is_host = true OR (
        -- 방 호스트가 아니더라도 모든 사용자에게 비디오 컨트롤 권한이 있는 방은 허용
        SELECT video_control_permission FROM rooms
        WHERE id = (SELECT room_id FROM playlists WHERE id = playlist_id)
      ) = 'all-users')
    )
  )
);

CREATE POLICY "사용자는 자신의 플레이리스트에서 비디오를 삭제할 수 있음"
ON playlist_videos FOR DELETE USING (
  playlist_id IN (
    SELECT id FROM playlists
    WHERE user_id = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_users 
      WHERE user_id = auth.uid() AND (is_host = true OR (
        -- 방 호스트가 아니더라도 모든 사용자에게 비디오 컨트롤 권한이 있는 방은 허용
        SELECT video_control_permission FROM rooms
        WHERE id = (SELECT room_id FROM playlists WHERE id = playlist_id)
      ) = 'all-users')
    )
  )
);

-- 시청 기록 테이블 정책
CREATE POLICY "사용자는 자신의 시청 기록만 볼 수 있음"
ON watch_history FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "사용자는 자신의 시청 기록만 추가할 수 있음"
ON watch_history FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "사용자는 자신의 시청 기록만 업데이트할 수 있음"
ON watch_history FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "사용자는 자신의 시청 기록만 삭제할 수 있음"
ON watch_history FOR DELETE USING (user_id = auth.uid()); 