# Node.js 20 이미지를 베이스로 사용
FROM node:20

# 컨테이너 내부 작업 디렉터리 설정
WORKDIR /app

# package.json, package-lock.json 등을 먼저 복사
# 의존성 설치 레이어 캐시를 활용하기 위한 전형적인 패턴
COPY package*.json ./

# npm install로 프론트엔드 의존성 설치
RUN npm install

# 나머지 소스 전체 복사
# src/, public/, vite.config.js 등이 포함된다
COPY . .

# Vite 개발 서버 포트
EXPOSE 5173

# 컨테이너 시작 시 Vite dev server 실행
# --host 0.0.0.0 으로 해야 컨테이너 바깥(host 브라우저)에서 접근 가능
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]