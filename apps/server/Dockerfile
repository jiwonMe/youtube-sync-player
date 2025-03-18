FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 모노레포 루트 파일 복사
COPY . .

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
RUN pnpm install

# shared 패키지 빌드
RUN cd packages/shared && pnpm run build

# 서버 빌드
RUN cd apps/server && pnpm run build

# 디버깅을 위한 디렉토리 구조 출력
RUN ls -la /app
RUN ls -la /app/apps/server
RUN ls -la /app/apps/server/dist || echo "dist 디렉토리가 없습니다"
RUN find /app -name "socket-server.js"

# 포트 설정
EXPOSE 3000

# 서버 실행 (빌드된 파일 위치에 따라 경로 조정)
CMD ["sh", "-c", "cd /app && node $(find /app -name 'socket-server.js' | grep dist)"]
