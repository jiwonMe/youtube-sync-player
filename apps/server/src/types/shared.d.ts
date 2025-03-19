declare module 'shared' {
  export interface RoomUser {
    id: string;
    name: string;
    image?: string;
    isHost: boolean;
    socketId: string;
  }

  export interface VideoItem {
    id: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
  }

  export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userImage?: string;
    message: string;
    timestamp: number;
  }
} 