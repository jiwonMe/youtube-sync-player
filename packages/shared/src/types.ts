// User types
export type RoomUser = {
  id: string;
  name: string;
  image?: string;
  isHost?: boolean;
  socketId: string;
};

// Video types
export type VideoItem = {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

// Chat types
export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  message: string;
  timestamp: number;
};

// Room types
export type RoomState = {
  roomId: string;
  roomName: string;
  description?: string;
  hostId: string;
  users: RoomUser[];
  currentVideo: VideoItem | null;
  playlist: VideoItem[];
  isPlaying: boolean;
  currentTime: number;
  messages: ChatMessage[];
  isPasswordProtected: boolean;
  password?: string;
  createdAt: number;
  autoplay: boolean;
}; 