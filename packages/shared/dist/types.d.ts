export type RoomUser = {
    id: string;
    name: string;
    image?: string;
    isHost?: boolean;
    socketId: string;
};
export type VideoItem = {
    id: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
};
export type ChatMessage = {
    id: string;
    userId: string;
    userName: string;
    userImage?: string;
    message: string;
    timestamp: number;
};
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
    lastSyncTime?: number;
    videoControlPermission: 'host-only' | 'all-users';
};
