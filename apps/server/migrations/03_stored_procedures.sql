-- 03_stored_procedures.sql
-- 저장 프로시저 및 함수 정의

-- 활성화된 방 목록을 조회하는 저장 프로시저
CREATE OR REPLACE FUNCTION get_active_rooms(limit_val INT DEFAULT 10, offset_val INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  host_id UUID,
  password TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  video_control_permission TEXT,
  host JSONB,
  user_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.host_id,
    r.password,
    r.created_at,
    r.updated_at,
    r.is_active,
    r.video_control_permission,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'avatar_url', u.avatar_url
    ) AS host,
    COUNT(ru.id) AS user_count
  FROM rooms r
  JOIN users u ON r.host_id = u.id
  JOIN room_users ru ON r.id = ru.room_id
  WHERE r.is_active = true
  GROUP BY r.id, u.id
  ORDER BY r.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;

-- 사용자의 플레이리스트 목록을 조회하는 저장 프로시저
CREATE OR REPLACE FUNCTION get_user_playlists(user_id_val UUID)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  user_id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  video_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.room_id,
    p.user_id,
    p.name,
    p.created_at,
    p.updated_at,
    COUNT(pv.id) AS video_count
  FROM playlists p
  LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
  WHERE p.user_id = user_id_val
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 방의 플레이리스트 목록을 조회하는 저장 프로시저
CREATE OR REPLACE FUNCTION get_room_playlists(room_id_val UUID)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  user_id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  video_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.room_id,
    p.user_id,
    p.name,
    p.created_at,
    p.updated_at,
    COUNT(pv.id) AS video_count
  FROM playlists p
  LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
  WHERE p.room_id = room_id_val
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 사용자가 최근에 참여한 방 목록을 조회하는 저장 프로시저
CREATE OR REPLACE FUNCTION get_user_recent_rooms(user_id_val UUID, limit_val INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  host_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  video_control_permission TEXT,
  joined_at TIMESTAMPTZ,
  host_name TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.host_id,
    r.created_at,
    r.updated_at,
    r.is_active,
    r.video_control_permission,
    ru.joined_at,
    u.username AS host_name
  FROM room_users ru
  JOIN rooms r ON ru.room_id = r.id
  JOIN users u ON r.host_id = u.id
  WHERE ru.user_id = user_id_val
  ORDER BY ru.joined_at DESC
  LIMIT limit_val;
END;
$$;

-- 사용자 시청 기록에서 자주 본 비디오 카테고리를 조회하는 저장 프로시저
CREATE OR REPLACE FUNCTION get_user_favorite_categories(user_id_val UUID, limit_val INT DEFAULT 3)
RETURNS TABLE (
  category TEXT,
  view_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'category' AS category,  -- 여기에 실제 카테고리 필드가 추가되면 변경
    COUNT(*) AS view_count
  FROM watch_history wh
  JOIN videos v ON wh.video_id = v.id
  WHERE wh.user_id = user_id_val
  GROUP BY 'category'  -- 여기에 실제 카테고리 필드가 추가되면 변경
  ORDER BY view_count DESC
  LIMIT limit_val;
END;
$$; 