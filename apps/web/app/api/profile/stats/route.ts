import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase';

/**
 * 사용자 프로필 통계 API 라우트
 * 사용자의 활동 통계를 조회하여 반환합니다.
 */
export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Supabase 서비스 롤 클라이언트 생성 (RLS 우회)
    const supabase = createServiceRoleClient();
    
    // 사용자 ID 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
      
    let userId;
    
    if (userError || !userData) {
      console.log('사용자 조회 오류:', userError);
      
      // 사용자를 찾을 수 없는 경우 새로 생성
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '사용자',
          avatar_url: user.imageUrl || '',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createError || !newUser) {
        console.error('사용자 생성 오류:', createError);
        return NextResponse.json({ error: 'Failed to create user in database' }, { status: 500 });
      }
      
      userId = newUser.id;
      console.log('새 사용자가 생성되었습니다:', userId);
    } else {
      userId = userData.id;
    }
    
    // 1. 생성한 방 개수 조회
    const { count: roomsCreated, error: roomsCreatedError } = await supabase
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', userId);
      
    if (roomsCreatedError) {
      console.error('방 생성 수 조회 오류:', roomsCreatedError);
    }
    
    // 2. 참여한 방 개수 조회
    const { count: roomsJoined, error: roomsJoinedError } = await supabase
      .from('room_users')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (roomsJoinedError) {
      console.error('방 참여 수 조회 오류:', roomsJoinedError);
    }
    
    // 3. 총 시청 시간 조회
    const { data: watchData, error: watchError } = await supabase
      .from('watch_history')
      .select('watch_duration')
      .eq('user_id', userId);
      
    if (watchError) {
      console.error('시청 시간 조회 오류:', watchError);
    }
    
    // 총 시청 시간 계산 (초 단위)
    const totalWatchSeconds = watchData?.reduce((total, item) => total + (item.watch_duration || 0), 0) || 0;
    
    // 4. 선호 카테고리 조회 (저장 프로시저 활용)
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_user_favorite_categories', {
        user_id_val: userId,
        limit_val: 1
      });
      
    let favoriteCategory = 'Music'; // 기본값
    
    if (categoryError) {
      console.error('선호 카테고리 조회 오류:', categoryError);
      // 오류 발생 시 기본 쿼리로 폴백 (아직 카테고리 데이터가 없을 수 있음)
      favoriteCategory = 'Music';
    } else if (categoryData && categoryData.length > 0) {
      favoriteCategory = categoryData[0].category;
    }
    
    return NextResponse.json({
      roomsCreated: roomsCreated || 0,
      roomsJoined: roomsJoined || 0,
      totalWatchSeconds,
      favoriteCategory
    });
    
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 