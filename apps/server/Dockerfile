FROM node:18-alpine AS builder

WORKDIR /app

# 모노레포 루트 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# pnpm 설치 및 의존성 설치
RUN npm install -g pnpm
RUN pnpm install

# 소스 코드 복사
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# shared 패키지 빌드
RUN cd packages/shared && pnpm run build

# 서버 빌드
RUN cd apps/server && pnpm run build

# 실행 이미지
FROM node:18-alpine

WORKDIR /app

# 빌드된 파일과 필요한 의존성만 복사
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# 프로덕션 의존성만 설치
RUN npm install -g pnpm
RUN pnpm install --prod

# 디버깅을 위한 디렉토리 구조 출력
RUN ls -la /app
RUN ls -la /app/apps/server/dist || echo "dist 디렉토리가 없습니다"

# 서버 실행
EXPOSE 3000
CMD ["node", "/app/apps/server/dist/socket-server.js"]
