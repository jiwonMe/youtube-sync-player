import { Socket, Server } from 'socket.io';
import { roomSupabaseStore } from '../services/roomSupabaseStore';
import { logger } from '../utils/logger';
import type { VideoItem } from 'shared';

/**
 * 비디오 변경 처리
 */
export async function handleVideoChange(socket: Socket, io: Server, videoId: string, userId: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 새 비디오 찾기
    const video = room.playlist.find((v) => v.id === videoId);
    
    if (video) {
      // 현재 비디오 업데이트
      await roomSupabaseStore.updateRoom(roomId, {
        currentVideo: video,
        currentTime: 0,
        isPlaying: true,
        lastSyncTime: Date.now()
      });
      
      // 다른 모든 참가자들에게 전파
      io.to(roomId).emit("video:change", videoId);
      
      // 이벤트 로그 생성
      const user = room.users.find(u => u.id === userId);
      if (user) {
        await roomSupabaseStore.addEventLog(
          roomId, 
          user, 
          'videoChange',
          { videoId, videoTitle: video.title }
        );
      }
      
      logger.info('handleVideoChange', `User ${userId} changed video to ${video.title} in room ${roomId}`);
    }
  } catch (error) {
    logger.error('handleVideoChange', 'Error handling video change', error);
  }
}

/**
 * 재생목록 업데이트 처리
 */
export async function handlePlaylistUpdate(socket: Socket, playlist: VideoItem[], userId: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 재생목록 업데이트
    await roomSupabaseStore.updateRoom(roomId, { playlist });
    
    // 다른 모든 참가자들에게 전파
    socket.to(roomId).emit("playlist:update", playlist);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      await roomSupabaseStore.addEventLog(roomId, user, 'playlistReorder');
    }
    
    logger.info('handlePlaylistUpdate', `User ${userId} updated playlist in room ${roomId}`);
  } catch (error) {
    logger.error('handlePlaylistUpdate', 'Error handling playlist update', error);
  }
}

/**
 * 재생목록에 비디오 추가 처리
 */
export async function handlePlaylistAdd(socket: Socket, io: Server, video: VideoItem, userId: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 재생목록 복사
    const updatedPlaylist = [...room.playlist, video];
    
    // 현재 재생 중인 비디오가 없는 경우, 새 비디오를 현재 비디오로 설정
    const updates: any = { playlist: updatedPlaylist };
    
    if (!room.currentVideo) {
      updates.currentVideo = video;
      updates.isPlaying = room.autoplay;
      updates.currentTime = 0;
    }
    
    // 재생목록 업데이트
    await roomSupabaseStore.updateRoom(roomId, updates);
    
    // 다른 모든 참가자들에게 전파
    io.to(roomId).emit("playlist:update", updatedPlaylist);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      await roomSupabaseStore.addEventLog(
        roomId, 
        user, 
        'playlistAdd',
        { videoId: video.id, videoTitle: video.title }
      );
    }
    
    logger.info('handlePlaylistAdd', `User ${userId} added video ${video.title} to playlist in room ${roomId}`);
  } catch (error) {
    logger.error('handlePlaylistAdd', 'Error handling playlist add', error);
  }
}

/**
 * 재생목록에서 비디오 제거 처리
 */
export async function handlePlaylistRemove(socket: Socket, io: Server, videoId: string, userId: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 재생목록에서 제거할 비디오 찾기
    const videoIndex = room.playlist.findIndex((v) => v.id === videoId);
    
    if (videoIndex !== -1) {
      const removedVideo = room.playlist[videoIndex];
      
      // 재생목록 복사 및 항목 제거
      const updatedPlaylist = [...room.playlist];
      updatedPlaylist.splice(videoIndex, 1);
      
      // 업데이트 객체 초기화
      const updates: any = { playlist: updatedPlaylist };
      
      // 현재 재생 중인 비디오가 제거된 경우, 다음 비디오를 재생
      if (room.currentVideo && room.currentVideo.id === videoId) {
        if (updatedPlaylist.length > 0) {
          // 다음 비디오 선택
          updates.currentVideo = updatedPlaylist[0];
          updates.currentTime = 0;
          
          // 변경된 비디오 정보 전파
          io.to(roomId).emit("video:change", updatedPlaylist[0].id);
        } else {
          // 재생목록이 비어있으면 현재 비디오 제거
          updates.currentVideo = null;
          updates.isPlaying = false;
        }
      }
      
      // 상태 업데이트
      await roomSupabaseStore.updateRoom(roomId, updates);
      
      // 업데이트된 재생목록 전파
      io.to(roomId).emit("playlist:update", updatedPlaylist);
      
      // 이벤트 로그 생성
      const user = room.users.find(u => u.id === userId);
      if (user) {
        await roomSupabaseStore.addEventLog(
          roomId, 
          user, 
          'playlistRemove',
          { videoId, videoTitle: removedVideo.title }
        );
      }
      
      logger.info('handlePlaylistRemove', `User ${userId} removed video ${removedVideo.title} from playlist in room ${roomId}`);
    }
  } catch (error) {
    logger.error('handlePlaylistRemove', 'Error handling playlist remove', error);
  }
} 