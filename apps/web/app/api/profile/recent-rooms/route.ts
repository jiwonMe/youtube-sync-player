import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-auth';

/**
 * 사용자가 최근에 참여한 방 목록 API 라우트
 * 사용자가 참여한 방 목록을 최신순으로 반환합니다.
 */
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // URL 파라미터 처리
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // 인증된 Supabase 클라이언트 생성 (사용자 권한으로 RLS 정책 적용)
    const supabase = await getAuthenticatedSupabaseClient();
    
    // 사용자 ID 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
      
    if (userError || !userData) {
      console.error('사용자 조회 오류:', userError);
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    const userId = userData.id;
    
    // 최근 참여한 방 조회
    try {
      // 저장 프로시저를 사용하여 최근 방 목록 조회
      const { data: roomsData, error: roomsError } = await supabase
        .rpc('get_user_recent_rooms', {
          user_id_val: userId,
          limit_val: limit
        });
        
      if (roomsError) {
        console.error('최근 방 조회 오류:', roomsError);
        throw roomsError;
      }
      
      return NextResponse.json({
        rooms: roomsData || []
      });
    } catch (rpcError) {
      // 저장 프로시저 오류 시 기본 쿼리로 폴백
      console.warn('저장 프로시저 오류, 기본 쿼리 사용:', rpcError);
      
      // 기본 쿼리로 대체: 사용자가 참여한 방 목록 조회
      const { data, error } = await supabase
        .from('room_users')
        .select(`
          room_id,
          joined_at,
          room:rooms(
            id,
            name,
            host_id,
            created_at,
            host:users!rooms_host_id_fkey(username, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('방 목록 조회 오류:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms', details: error.message }, { status: 500 });
      }
      
      // 방 데이터 변환
      const formattedRooms = data.map(item => {
        // room 객체와 host 배열에 안전하게 접근
        const room = item.room as any;
        const host = Array.isArray(room.host) && room.host.length > 0 ? room.host[0] : null;
        
        return {
          id: room.id,
          name: room.name,
          host_username: host?.username || 'Unknown',
          host_avatar_url: host?.avatar_url,
          user_count: 0, // 별도 쿼리 필요
          last_joined: item.joined_at
        };
      });
      
      // 각 방의 사용자 수 조회 (선택 사항)
      for (let room of formattedRooms) {
        const { count, error: countError } = await supabase
          .from('room_users')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', room.id);
          
        if (!countError) {
          room.user_count = count || 0;
        }
      }
      
      return NextResponse.json({
        rooms: formattedRooms
      });
    }
    
  } catch (error) {
    console.error('방 목록 조회 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent rooms', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 