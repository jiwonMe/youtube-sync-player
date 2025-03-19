import { RoomState, EventLog, VideoControlPermission } from '../types';
import { supabase } from '../../supabase';
import { generateId, getCurrentTimestamp } from '../utils/helpers';
import { logger } from '../utils/logger';
import config from '../config';
import type { RoomUser, VideoItem, ChatMessage } from 'shared';

// Supabase 쿼리 결과를 위한 타입 정의
interface UserRecord {
  id: string;
  clerk_id: string;
  username: string;
  avatar_url: string | null;
}

interface RoomUserRecord {
  user_id: string;
  is_host?: boolean;
  users: UserRecord;
}

interface VideoRecord {
  id: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
}

interface PlaylistVideoRecord {
  position: number;
  videos: VideoRecord;
}

/**
 * Supabase 기반 룸 데이터 저장소
 * 방 정보를 Supabase 데이터베이스와 연동하여 관리합니다.
 */
class RoomSupabaseStore {
  private cachedRoomNames: Map<string, string>; // roomName (lowercase) -> roomId (캐시)

  constructor() {
    this.cachedRoomNames = new Map<string, string>();
    logger.info('RoomSupabaseStore', 'Supabase Room Store initialized');
  }

  /**
   * 모든 방 목록을 반환
   */
  async getAllRooms(): Promise<RoomState[]> {
    try {
      // 활성화된 방만 조회
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          description,
          host_id,
          password,
          created_at,
          updated_at,
          is_active,
          video_control_permission,
          room_users(user_id)
        `)
        .eq('is_active', true);

      if (error) {
        logger.error('RoomSupabaseStore', 'Failed to fetch rooms', error);
        return [];
      }

      // 방 정보를 RoomState 형식으로 변환
      const roomStates: RoomState[] = await Promise.all(
        rooms.map(async (room) => {
          const { data: roomUsers } = await supabase
            .from('room_users')
            .select(`
              user_id,
              users!inner(id, clerk_id, username, avatar_url)
            `)
            .eq('room_id', room.id)
            .is('left_at', null);

          // 현재 재생 중인 비디오와 플레이리스트 조회
          const { data: playlist } = await this.getRoomPlaylist(room.id);

          // RoomState 객체 생성
          return {
            roomId: room.id,
            roomName: room.name,
            description: room.description || undefined,
            hostId: room.host_id,
            users: (roomUsers || []).map(ru => {
              const user = ru.users as any;
              return {
                id: user?.clerk_id || '',
                name: user?.username || 'Unknown User',
                image: user?.avatar_url || '',
                isHost: ru.user_id === room.host_id,
                socketId: '', // 소켓 연결 시 업데이트됨
              };
            }),
            currentVideo: playlist && playlist.length > 0 ? playlist[0] : null,
            playlist: playlist || [],
            isPlaying: false,
            currentTime: 0,
            messages: [],
            eventLogs: [],
            isPasswordProtected: !!room.password,
            password: room.password || undefined,
            createdAt: new Date(room.created_at).getTime(),
            autoplay: true,
            lastSyncTime: new Date().getTime(),
            videoControlPermission: (room.video_control_permission || 'host-only') as VideoControlPermission
          };
        })
      );

      return roomStates;
    } catch (error) {
      logger.error('RoomSupabaseStore', 'Error getting all rooms', error);
      return [];
    }
  }

  /**
   * 방 ID로 방 정보 조회
   */
  async getRoom(roomId: string): Promise<RoomState | null> {
    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .eq('is_active', true)
        .single();

      if (error || !room) {
        logger.debug('RoomSupabaseStore', `Room not found: ${roomId}`, error);
        return null;
      }

      // 방에 있는 사용자 조회
      const { data: roomUsers } = await supabase
        .from('room_users')
        .select(`
          id,
          user_id,
          is_host,
          users!inner(id, clerk_id, username, avatar_url)
        `)
        .eq('room_id', roomId)
        .is('left_at', null);

      // 현재 재생 중인 비디오와 플레이리스트 조회
      const { data: playlist } = await this.getRoomPlaylist(roomId);

      // RoomState 객체 생성
      const roomState: RoomState = {
        roomId: room.id,
        roomName: room.name,
        description: room.description || undefined,
        hostId: room.host_id,
        users: (roomUsers || []).map(ru => {
          const user = ru.users as any;
          return {
            id: user?.clerk_id || '',
            name: user?.username || 'Unknown User',
            image: user?.avatar_url || '',
            isHost: ru.is_host || false,
            socketId: '',
          };
        }),
        currentVideo: playlist && playlist.length > 0 ? playlist[0] : null,
        playlist: playlist || [],
        isPlaying: false,
        currentTime: 0,
        messages: [],
        eventLogs: [],
        isPasswordProtected: !!room.password,
        password: room.password || undefined,
        createdAt: new Date(room.created_at).getTime(),
        autoplay: true,
        lastSyncTime: new Date().getTime(),
        videoControlPermission: (room.video_control_permission || 'host-only') as VideoControlPermission
      };

      return roomState;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error getting room: ${roomId}`, error);
      return null;
    }
  }

  /**
   * 방의 플레이리스트 조회
   */
  private async getRoomPlaylist(roomId: string): Promise<{ data: VideoItem[] }> {
    try {
      // 방의 플레이리스트 ID 조회
      const { data: playlist } = await supabase
        .from('playlists')
        .select('id')
        .eq('room_id', roomId)
        .single();

      if (!playlist) {
        return { data: [] };
      }

      // 플레이리스트의 비디오 항목 조회
      const { data: playlistVideos } = await supabase
        .from('playlist_videos')
        .select(`
          position,
          videos!inner(id, youtube_id, title, thumbnail_url)
        `)
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: true });

      if (!playlistVideos || playlistVideos.length === 0) {
        return { data: [] };
      }

      // VideoItem 형식으로 변환 - VideoItem 타입에 맞게 필드명 조정
      const videos: VideoItem[] = playlistVideos.map(pv => {
        const video = pv.videos as any;
        return {
          id: video?.youtube_id || '',
          title: video?.title || 'Unknown Video',
          thumbnail: video?.thumbnail_url || '',
          videoId: video?.youtube_id || '',
          thumbnailUrl: video?.thumbnail_url || ''
        };
      });

      return { data: videos };
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error getting playlist for room: ${roomId}`, error);
      return { data: [] };
    }
  }

  /**
   * 방 이름으로 방 검색
   */
  async findRoomByName(name: string): Promise<RoomState | null> {
    try {
      const lowerName = name.toLowerCase();
      
      // 캐시에서 먼저 확인
      const cachedRoomId = this.cachedRoomNames.get(lowerName);
      if (cachedRoomId) {
        const room = await this.getRoom(cachedRoomId);
        if (room) return room;
        // 캐시가 유효하지 않으면 제거
        this.cachedRoomNames.delete(lowerName);
      }

      // 데이터베이스에서 조회
      const { data: room, error } = await supabase
        .from('rooms')
        .select('id')
        .ilike('name', name)
        .eq('is_active', true)
        .single();

      if (error || !room) {
        return null;
      }

      // 캐시 업데이트
      this.cachedRoomNames.set(lowerName, room.id);

      return await this.getRoom(room.id);
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error finding room by name: ${name}`, error);
      return null;
    }
  }

  /**
   * 방 이름 중복 확인
   */
  async isRoomNameTaken(name: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .ilike('name', name)
        .eq('is_active', true);

      if (error) {
        logger.error('RoomSupabaseStore', `Error checking room name: ${name}`, error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error checking room name: ${name}`, error);
      return false;
    }
  }

  /**
   * 새 방 생성
   */
  async createRoom(roomData: {
    roomId: string;
    roomName: string;
    description?: string;
    hostId: string;
    isPasswordProtected: boolean;
    password?: string;
    playlist?: VideoItem[];
  }): Promise<RoomState> {
    const { roomId, roomName, description, hostId, isPasswordProtected, password, playlist = [] } = roomData;
    
    try {
      // 사용자 ID 조회 (Clerk ID -> DB User ID)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', hostId)
        .single();

      if (userError || !user) {
        logger.error('RoomSupabaseStore', `User not found: ${hostId}`, userError);
        throw new Error(`User not found: ${hostId}`);
      }

      // 새 방 생성
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          name: roomName,
          description,
          host_id: user.id,
          password: isPasswordProtected ? password : null,
          is_active: true,
          video_control_permission: 'host-only'
        })
        .select()
        .single();

      if (error || !room) {
        logger.error('RoomSupabaseStore', `Failed to create room: ${roomName}`, error);
        throw new Error(`Failed to create room: ${roomName}`);
      }

      // 호스트를 방 사용자로 추가
      await supabase
        .from('room_users')
        .insert({
          room_id: roomId,
          user_id: user.id,
          is_host: true
        });

      // 방 플레이리스트 생성
      if (playlist.length > 0) {
        // 플레이리스트 생성
        const { data: newPlaylist, error: playlistError } = await supabase
          .from('playlists')
          .insert({
            room_id: roomId,
            name: `${roomName} Playlist`
          })
          .select()
          .single();

        if (playlistError || !newPlaylist) {
          logger.error('RoomSupabaseStore', `Failed to create playlist for room: ${roomId}`, playlistError);
        } else {
          // 플레이리스트에 비디오 추가
          for (let i = 0; i < playlist.length; i++) {
            const video = playlist[i];
            
            // 비디오 조회 또는 생성
            let videoId: string;
            const { data: existingVideo } = await supabase
              .from('videos')
              .select('id')
              .eq('youtube_id', video.videoId)
              .single();

            if (existingVideo) {
              videoId = existingVideo.id;
            } else {
              const { data: newVideo } = await supabase
                .from('videos')
                .insert({
                  youtube_id: video.videoId,
                  title: video.title,
                  thumbnail_url: video.thumbnailUrl,
                  added_by: user.id
                })
                .select('id')
                .single();
              
              if (newVideo) {
                videoId = newVideo.id;
              } else {
                continue; // 비디오 생성 실패 시 다음으로
              }
            }

            // 플레이리스트에 비디오 추가
            await supabase
              .from('playlist_videos')
              .insert({
                playlist_id: newPlaylist.id,
                video_id: videoId,
                position: i
              });
          }
        }
      }

      // 캐시 업데이트
      this.cachedRoomNames.set(roomName.toLowerCase(), roomId);

      // 새 방 정보 조회 및 반환
      const newRoom = await this.getRoom(roomId);
      if (!newRoom) {
        throw new Error(`Failed to retrieve created room: ${roomId}`);
      }
      
      logger.info('RoomSupabaseStore', `Room created: ${roomName} (${roomId})`);
      return newRoom;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error creating room: ${roomName}`, error);
      
      // 인메모리 방식으로 폴백
      const room: RoomState = {
        roomId,
        roomName,
        hostId,
        users: [],
        currentVideo: playlist.length > 0 ? playlist[0] : null,
        playlist,
        isPlaying: false,
        currentTime: 0,
        messages: [],
        eventLogs: [],
        isPasswordProtected,
        password: isPasswordProtected ? password : undefined,
        createdAt: getCurrentTimestamp(),
        autoplay: true,
        description,
        lastSyncTime: getCurrentTimestamp(),
        videoControlPermission: 'host-only',
      };
      
      return room;
    }
  }

  /**
   * 방 정보 업데이트
   */
  async updateRoom(roomId: string, updates: Partial<RoomState>): Promise<RoomState | null> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return null;

      const updateData: Record<string, any> = {};

      // 방 이름 변경 처리
      if (updates.roomName && updates.roomName !== room.roomName) {
        updateData.name = updates.roomName;
        
        // 캐시 업데이트
        this.cachedRoomNames.delete(room.roomName.toLowerCase());
        this.cachedRoomNames.set(updates.roomName.toLowerCase(), roomId);
      }

      // 방 설명 변경
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }

      // 호스트 변경
      if (updates.hostId && updates.hostId !== room.hostId) {
        // 사용자 ID 조회 (Clerk ID -> DB User ID)
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', updates.hostId)
          .single();

        if (user) {
          updateData.host_id = user.id;
          
          // 기존 호스트 권한 해제
          await supabase
            .from('room_users')
            .update({ is_host: false })
            .eq('room_id', roomId)
            .eq('is_host', true);
          
          // 새 호스트 권한 설정
          await supabase
            .from('room_users')
            .update({ is_host: true })
            .eq('room_id', roomId)
            .eq('user_id', user.id);
        }
      }

      // 비밀번호 변경
      if (updates.isPasswordProtected !== undefined) {
        updateData.password = updates.isPasswordProtected ? updates.password : null;
      }

      // 비디오 제어 권한 변경
      if (updates.videoControlPermission) {
        updateData.video_control_permission = updates.videoControlPermission;
      }

      // 방 정보 업데이트
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', roomId);

        if (error) {
          logger.error('RoomSupabaseStore', `Failed to update room: ${roomId}`, error);
          return null;
        }
      }

      // 업데이트된 방 정보 조회 및 반환
      return await this.getRoom(roomId);
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error updating room: ${roomId}`, error);
      return null;
    }
  }

  /**
   * 방 삭제
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return false;

      // 실제로 삭제하지 않고 비활성화만 함
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        logger.error('RoomSupabaseStore', `Failed to delete room: ${roomId}`, error);
        return false;
      }

      // 캐시에서 제거
      this.cachedRoomNames.delete(room.roomName.toLowerCase());
      
      logger.info('RoomSupabaseStore', `Room deleted: ${room.roomName} (${roomId})`);
      return true;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error deleting room: ${roomId}`, error);
      return false;
    }
  }

  /**
   * 방에 사용자 추가
   */
  async addUserToRoom(roomId: string, user: RoomUser): Promise<RoomState | null> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return null;

      // 사용자 ID 조회 (Clerk ID -> DB User ID)
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) {
        logger.error('RoomSupabaseStore', `User not found: ${user.id}`, userError);
        
        // 새 사용자 생성
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: user.id,
            username: user.name,
            avatar_url: user.image
          })
          .select('id')
          .single();

        if (createError || !newUser) {
          logger.error('RoomSupabaseStore', `Failed to create user: ${user.id}`, createError);
          return null;
        }

        // 방에 사용자 추가
        const { error: joinError } = await supabase
          .from('room_users')
          .insert({
            room_id: roomId,
            user_id: newUser.id,
            is_host: user.isHost
          });

        if (joinError) {
          logger.error('RoomSupabaseStore', `Failed to add user to room: ${user.id} -> ${roomId}`, joinError);
          return null;
        }
      } else {
        // 이미 존재하는 사용자
        
        // 사용자 정보 업데이트
        await supabase
          .from('users')
          .update({
            username: user.name,
            avatar_url: user.image,
            last_seen_at: new Date()
          })
          .eq('id', dbUser.id);

        // 이미 방에 참여 중인지 확인
        const { data: existingRoomUser } = await supabase
          .from('room_users')
          .select('id, left_at')
          .eq('room_id', roomId)
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (!existingRoomUser) {
          // 방에 새로 참여
          await supabase
            .from('room_users')
            .insert({
              room_id: roomId,
              user_id: dbUser.id,
              is_host: user.isHost
            });
        } else {
          // 기존 참여 정보 업데이트
          await supabase
            .from('room_users')
            .update({
              left_at: null,
              is_host: user.isHost,
              joined_at: existingRoomUser.left_at ? new Date() : undefined
            })
            .eq('id', existingRoomUser.id);
        }
      }

      // 소켓 ID 연결은 메모리에만 저장 (DB에 저장하지 않음)
      // 메모리에 있는 사용자 정보에 소켓 ID 업데이트
      const updatedRoom = await this.getRoom(roomId);
      
      logger.debug('RoomSupabaseStore', `User added to room: ${user.name} (${user.id}) to ${roomId}`);
      return updatedRoom;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error adding user to room: ${user.id} -> ${roomId}`, error);
      return null;
    }
  }

  /**
   * 방에서 사용자 제거
   */
  async removeUserFromRoom(roomId: string, userId: string): Promise<{ room: RoomState | null, isRoomEmpty: boolean }> {
    try {
      // 사용자 ID 조회 (Clerk ID -> DB User ID)
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (!dbUser) {
        logger.error('RoomSupabaseStore', `User not found: ${userId}`);
        return { room: null, isRoomEmpty: false };
      }

      // 사용자 퇴장 처리
      const { error } = await supabase
        .from('room_users')
        .update({ left_at: new Date() })
        .eq('room_id', roomId)
        .eq('user_id', dbUser.id)
        .is('left_at', null);

      if (error) {
        logger.error('RoomSupabaseStore', `Failed to remove user from room: ${userId} from ${roomId}`, error);
        return { room: null, isRoomEmpty: false };
      }

      // 방 정보 다시 조회
      const updatedRoom = await this.getRoom(roomId);
      const isRoomEmpty = !updatedRoom || updatedRoom.users.length === 0;

      logger.debug('RoomSupabaseStore', `User removed from room: ${userId} from ${roomId}`);
      return { room: updatedRoom, isRoomEmpty };
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error removing user from room: ${userId} from ${roomId}`, error);
      return { room: null, isRoomEmpty: false };
    }
  }

  /**
   * 이벤트 로그 추가 (현재는 메모리에만 저장)
   */
  async addEventLog(roomId: string, user: RoomUser, eventType: EventLog['eventType'], details?: EventLog['details']): Promise<EventLog | null> {
    try {
      const eventLog: EventLog = {
        id: generateId(),
        user,
        eventType,
        details,
        timestamp: getCurrentTimestamp()
      };

      // 추후 이벤트 로그를 DB에 저장하는 기능 구현 예정
      // 현재는 메모리에만 저장하는 것으로 처리

      return eventLog;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error adding event log: ${roomId}`, error);
      return null;
    }
  }

  /**
   * 비밀번호 확인
   */
  async verifyPassword(roomId: string, password: string): Promise<boolean> {
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('password')
        .eq('id', roomId)
        .single();

      if (!room) return false;
      if (!room.password) return true;
      
      return room.password === password;
    } catch (error) {
      logger.error('RoomSupabaseStore', `Error verifying password: ${roomId}`, error);
      return false;
    }
  }

  /**
   * 현재 방 통계 정보
   */
  async getRoomStats(): Promise<{ totalRooms: number, totalUsers: number }> {
    try {
      // 활성화된 방 수 조회
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .eq('is_active', true);

      if (roomsError) {
        logger.error('RoomSupabaseStore', 'Failed to get room stats', roomsError);
        return { totalRooms: 0, totalUsers: 0 };
      }

      // 현재 활성 사용자 수 조회
      const { data: activeUsers, error: usersError } = await supabase
        .from('room_users')
        .select('id')
        .is('left_at', null);

      if (usersError) {
        logger.error('RoomSupabaseStore', 'Failed to get user stats', usersError);
        return { totalRooms: rooms.length, totalUsers: 0 };
      }
      
      return {
        totalRooms: rooms.length,
        totalUsers: activeUsers.length
      };
    } catch (error) {
      logger.error('RoomSupabaseStore', 'Error getting room stats', error);
      return { totalRooms: 0, totalUsers: 0 };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const roomSupabaseStore = new RoomSupabaseStore(); 