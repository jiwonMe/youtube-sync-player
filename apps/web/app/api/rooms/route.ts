import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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