import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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
    
    // 방 ID 생성
    const roomId = uuidv4();

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