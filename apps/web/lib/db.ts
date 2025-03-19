import { getAuthenticatedSupabaseClient } from './supabase-auth';
import { createServerSupabaseClient } from './supabase';
import { Database } from 'shared';

/**
 * 사용자 정보를 조회하는 함수
 * @param userId Supabase 사용자 ID
 */
export async function getUser(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
  
  return data;
}

/**
 * Clerk ID로 Supabase 사용자를 조회하는 함수
 * @param clerkId Clerk 사용자 ID
 */
export async function getUserByClerkId(clerkId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();
    
  if (error) {
    console.error('Clerk ID로 사용자 조회 오류:', error);
    return null;
  }
  
  return data;
}

/**
 * 활성화된 방 목록을 조회하는 함수
 * @param limit 조회할 방 개수
 * @param offset 오프셋
 */
export async function getActiveRooms(limit = 10, offset = 0) {
  const supabase = createServerSupabaseClient();
  
  try {
    // PostgreSQL 쿼리를 직접 실행하여 group by를 사용
    // 이 방식은 타입 단언이 필요 없으며 보다 타입 안전함
    const { data, error } = await supabase.rpc('get_active_rooms', {
      limit_val: limit,
      offset_val: offset
    });
    
    if (error) {
      console.error('활성화된 방 목록 조회 오류:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    // 저장 프로시저가 없는 경우 (개발 과정이므로) 기본 쿼리로 폴백
    console.warn('저장 프로시저 없음, 기존 방식으로 폴백:', error);
    
    // any 타입을 사용하여 타입 검사 우회
    const anySupabase = supabase as any;
    const query = anySupabase
      .from('rooms')
      .select(`
        *,
        host:users!rooms_host_id_fkey(id, username, avatar_url),
        user_count:room_users!inner(count)
      `)
      .eq('is_active', true);
      
    const result = await query
      .group('id, host.id')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (result.error) {
      console.error('활성화된 방 목록 조회 오류:', result.error);
      return [];
    }
    
    return result.data || [];
  }
}

/**
 * 방 상세 정보를 조회하는 함수
 * @param roomId 방 ID
 */
export async function getRoomById(roomId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      host:users!rooms_host_id_fkey(id, username, avatar_url),
      users:room_users(*)
    `)
    .eq('id', roomId)
    .single();
    
  if (error) {
    console.error('방 조회 오류:', error);
    return null;
  }
  
  return data;
}

/**
 * 사용자의 플레이리스트 목록을 조회하는 함수
 * @param userId 사용자 ID
 */
export async function getUserPlaylists(userId: string) {
  const supabase = createServerSupabaseClient();
  
  try {
    // PostgreSQL 쿼리를 직접 실행하여 group by를 사용
    // 이 방식은 타입 단언이 필요 없으며 보다 타입 안전함
    const { data, error } = await supabase.rpc('get_user_playlists', {
      user_id_val: userId
    });
    
    if (error) {
      console.error('사용자 플레이리스트 조회 오류:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    // 저장 프로시저가 없는 경우 (개발 과정이므로) 기본 쿼리로 폴백
    console.warn('저장 프로시저 없음, 기존 방식으로 폴백:', error);
    
    // any 타입을 사용하여 타입 검사 우회
    const anySupabase = supabase as any;
    const query = anySupabase
      .from('playlists')
      .select(`
        *,
        video_count:playlist_videos(count)
      `)
      .eq('user_id', userId);
      
    const result = await query
      .group('id')
      .order('created_at', { ascending: false });
      
    if (result.error) {
      console.error('사용자 플레이리스트 조회 오류:', result.error);
      return [];
    }
    
    return result.data || [];
  }
}

/**
 * 플레이리스트 비디오 목록을 조회하는 함수
 * @param playlistId 플레이리스트 ID
 */
export async function getPlaylistVideos(playlistId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('playlist_videos')
    .select(`
      *,
      video:videos(*)
    `)
    .eq('playlist_id', playlistId)
    .order('position');
    
  if (error) {
    console.error('플레이리스트 비디오 조회 오류:', error);
    return [];
  }
  
  return data;
}

/**
 * 사용자의 시청 기록을 조회하는 함수
 * @param userId 사용자 ID
 * @param limit 조회할 개수
 */
export async function getUserWatchHistory(userId: string, limit = 10) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      *,
      video:videos(*)
    `)
    .eq('user_id', userId)
    .order('watched_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('시청 기록 조회 오류:', error);
    return [];
  }
  
  return data;
} 