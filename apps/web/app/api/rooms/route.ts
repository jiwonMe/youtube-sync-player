import { NextResponse } from 'next/server';

/**
 * 5자리 영어 대문자로 구성된 랜덤 방 코드 생성
 * 
 * @returns 5자리 영어 대문자 코드
 */
function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * 방 목록을 가져오는 GET 메서드
 * 소켓 서버로부터 현재 활성화된 모든 방의 목록을 가져옵니다
 */
export async function GET() {
  try {
    // 소켓 서버에서 방 목록 가져오기
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${socketServerUrl}/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rooms from socket server');
    }

    const rooms = await response.json();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 방 코드 생성 (5자리 영어 대문자)
    const roomId = generateRoomCode();

    // 소켓 서버에 방 생성 요청
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${socketServerUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        roomName: body.roomName,
        description: body.description,
        isPasswordProtected: body.isPasswordProtected,
        password: body.password,
        createdBy: body.createdBy,
        playlist: body.playlist ? body.playlist : [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room on socket server');
    }

    return NextResponse.json({ roomId });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
