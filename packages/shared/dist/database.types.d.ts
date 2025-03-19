/**
 * Supabase Database Types
 *
 * 이 파일은 Supabase 데이터베이스의 스키마 타입을 정의합니다.
 */
export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    clerk_id: string;
                    username: string;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                    last_seen_at: string | null;
                    settings: Json | null;
                };
                Insert: {
                    id?: string;
                    clerk_id: string;
                    username: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_seen_at?: string | null;
                    settings?: Json | null;
                };
                Update: {
                    id?: string;
                    clerk_id?: string;
                    username?: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_seen_at?: string | null;
                    settings?: Json | null;
                };
                Relationships: [];
            };
            rooms: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    host_id: string;
                    password: string | null;
                    created_at: string;
                    updated_at: string;
                    is_active: boolean;
                    video_control_permission: 'host-only' | 'all-users';
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    host_id: string;
                    password?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_active?: boolean;
                    video_control_permission?: 'host-only' | 'all-users';
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    host_id?: string;
                    password?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_active?: boolean;
                    video_control_permission?: 'host-only' | 'all-users';
                };
                Relationships: [
                    {
                        foreignKeyName: "rooms_host_id_fkey";
                        columns: ["host_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            room_users: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string;
                    joined_at: string;
                    left_at: string | null;
                    is_host: boolean;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    user_id: string;
                    joined_at?: string;
                    left_at?: string | null;
                    is_host?: boolean;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    user_id?: string;
                    joined_at?: string;
                    left_at?: string | null;
                    is_host?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: "room_users_room_id_fkey";
                        columns: ["room_id"];
                        referencedRelation: "rooms";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "room_users_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            videos: {
                Row: {
                    id: string;
                    youtube_id: string;
                    title: string;
                    thumbnail_url: string;
                    added_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    youtube_id: string;
                    title: string;
                    thumbnail_url: string;
                    added_by: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    youtube_id?: string;
                    title?: string;
                    thumbnail_url?: string;
                    added_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "videos_added_by_fkey";
                        columns: ["added_by"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            playlists: {
                Row: {
                    id: string;
                    room_id: string | null;
                    user_id: string | null;
                    name: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    room_id?: string | null;
                    user_id?: string | null;
                    name: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string | null;
                    user_id?: string | null;
                    name?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "playlists_room_id_fkey";
                        columns: ["room_id"];
                        referencedRelation: "rooms";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "playlists_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            playlist_videos: {
                Row: {
                    id: string;
                    playlist_id: string;
                    video_id: string;
                    position: number;
                    added_at: string;
                };
                Insert: {
                    id?: string;
                    playlist_id: string;
                    video_id: string;
                    position: number;
                    added_at?: string;
                };
                Update: {
                    id?: string;
                    playlist_id?: string;
                    video_id?: string;
                    position?: number;
                    added_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "playlist_videos_playlist_id_fkey";
                        columns: ["playlist_id"];
                        referencedRelation: "playlists";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "playlist_videos_video_id_fkey";
                        columns: ["video_id"];
                        referencedRelation: "videos";
                        referencedColumns: ["id"];
                    }
                ];
            };
            watch_history: {
                Row: {
                    id: string;
                    user_id: string;
                    video_id: string;
                    room_id: string | null;
                    watched_at: string;
                    watch_duration: number;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    video_id: string;
                    room_id?: string | null;
                    watched_at?: string;
                    watch_duration: number;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    video_id?: string;
                    room_id?: string | null;
                    watched_at?: string;
                    watch_duration?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "watch_history_room_id_fkey";
                        columns: ["room_id"];
                        referencedRelation: "rooms";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "watch_history_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "watch_history_video_id_fkey";
                        columns: ["video_id"];
                        referencedRelation: "videos";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_active_rooms: {
                Args: {
                    limit_val: number;
                    offset_val: number;
                };
                Returns: {
                    id: string;
                    name: string;
                    description: string | null;
                    host_id: string;
                    password: string | null;
                    created_at: string;
                    updated_at: string;
                    is_active: boolean;
                    video_control_permission: string;
                    host_username: string;
                    host_avatar_url: string | null;
                    user_count: number;
                }[];
            };
            get_user_playlists: {
                Args: {
                    user_id_val: string;
                };
                Returns: {
                    id: string;
                    room_id: string | null;
                    user_id: string;
                    name: string;
                    created_at: string;
                    updated_at: string;
                    video_count: number;
                }[];
            };
            get_room_playlists: {
                Args: {
                    room_id_val: string;
                };
                Returns: {
                    id: string;
                    room_id: string;
                    user_id: string | null;
                    name: string;
                    created_at: string;
                    updated_at: string;
                    video_count: number;
                }[];
            };
            get_user_recent_rooms: {
                Args: {
                    user_id_val: string;
                    limit_val: number;
                };
                Returns: {
                    id: string;
                    name: string;
                    host_username: string;
                    host_avatar_url: string | null;
                    user_count: number;
                    last_joined: string;
                }[];
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
