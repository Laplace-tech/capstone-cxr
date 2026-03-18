# capstone-cxr 팀 온보딩 및 리포 운영 가이드

---

## 1. 문서 목적

이 문서는 현재 `capstone-cxr` 리포에서 **무엇이 완료되었는지**, 팀원들이 **이 리포를 앞으로 어떻게 써야 하는지**, 그리고 **GitHub 리포를 어떻게 운영하면 되는지**를 한 번에 정리한 배포용 문서입니다.

현재 기준으로 이 리포는 단순 코드 보관소가 아니라, React / Spring Boot / FastAPI / PostgreSQL을 한 제품 안에서 동시에 개발할 수 있는 **모노레포 기반 캡스톤 서비스 리포**로 세팅된 상태입니다.

---

## 2. 현재까지 완료된 작업

### 2.1 모노레포 구조 정리 완료
- `apps/frontend`
- `apps/backend`
- `apps/ai-service`
- `docs`
- `infra`
- `packages/contracts`
- `shared`

### 2.2 앱 골격 생성 완료
- **Frontend:** Vite + React 생성 완료
- **Backend:** Spring Boot 최소 서버 생성 완료
- **AI Service:** FastAPI 최소 서버 생성 완료

### 2.3 단독 실행 검증 완료
- `frontend` 단독 실행 확인
- `backend` 단독 실행 확인
- `ai-service` 단독 실행 확인

### 2.4 Docker Compose 통합 실행 완료
다음 4개 서비스가 동시에 기동되는 것 확인 완료:
- `frontend`
- `backend`
- `ai-service`
- `postgres`

### 2.5 서비스 간 통신 검증 완료
- `backend` → `ai-service` `/health` 호출 성공
- `frontend` → `backend` `/api/hello` 호출 성공

> **요약:** 현재 시점에서 **리포 골격 + 서버 기동 + 서비스 간 최소 통신**까지 모두 끝난 상태입니다.

---

## 3. 현재 리포 구조

```text
capstone-cxr/
├─ apps/
│  ├─ frontend/      # React + Vite
│  ├─ backend/       # Spring Boot
│  └─ ai-service/    # FastAPI + 추론 서버
├─ docs/             # 문서 정리
├─ infra/
│  ├─ docker/        # Dockerfile
│  ├─ compose/       # docker-compose
│  └─ nginx/         # 향후 reverse proxy
├─ packages/
│  └─ contracts/     # FE/BE/AI 계약서
└─ shared/
   ├─ uploads/       # 업로드 파일
   └─ generated/     # 생성 결과물
```

---

## 4. 현재 팀 구성

현재 역할은 아래와 같이 확정합니다.

- **FE:** 하윤진, 손세연
- **BE:** 송호성, 이용준
- **AI:** 박용민, 박지원

---

## 5. 앱별 현재 역할

### 5.1 Frontend (`apps/frontend`)
- 현재 역할: 사용자 화면 제공, 백엔드 API 호출, 결과 화면 렌더링 기반 마련
- 현재 확인된 것: Vite dev server 기동, backend와 연결 테스트 성공
- 앞으로 해야 할 일: 업로드 화면, 분석 상태 표시, 결과 조회 페이지, Grad-CAM 표시 UI

### 5.2 Backend (`apps/backend`)
- 현재 역할: 서비스의 중심 제어 계층, frontend 요청 수신, ai-service 호출, 향후 DB 저장과 상태관리 담당
- 현재 확인된 것:
  - `/actuator/health` 정상 응답
  - `/api/hello` 정상 응답
  - `/api/integration/ai-health`로 ai-service health 호출 성공
- 앞으로 해야 할 일: 업로드 API, 분석 요청 API, 결과 저장 및 조회 API, 인증/인가, DB 도메인 설계

### 5.3 AI Service (`apps/ai-service`)
- 현재 역할: 추론 전용 HTTP API 서버, 향후 모델 로딩 / 추론 / Grad-CAM 생성 담당
- 현재 확인된 것: `/`, `/health`, `/version`, FastAPI docs(`/docs`) 정상 응답
- 앞으로 해야 할 일: `/predict`, 모델 버전 로딩, threshold 로딩, Grad-CAM 산출물 생성, 추론 결과 JSON 고정

---

## 6. 현재 검증이 끝난 통신 구조

### 6.1 frontend → backend
- frontend에서 `/api/hello` 요청
- Vite proxy를 통해 backend 전달
- backend JSON 응답 확인 완료

### 6.2 backend → ai-service
- backend가 `AI_SERVICE_BASE_URL`을 사용
- ai-service `/health` 호출 성공

### 6.3 compose 통합
- compose로 모든 서비스 동시 기동 성공
- 각 서비스가 서로 다른 포트와 네트워크에서 정상 통신

---

## 7. 로컬 개발 환경 사용법

### 7.1 전체 서비스 기동

```bash
docker compose -f infra/compose/docker-compose.dev.yml up --build
```

백그라운드 실행:

```bash
docker compose -f infra/compose/docker-compose.dev.yml up --build -d
```

### 7.2 중지

```bash
docker compose -f infra/compose/docker-compose.dev.yml down
```

### 7.3 로그 보기

```bash
docker compose -f infra/compose/docker-compose.dev.yml logs -f
```

특정 서비스만:

```bash
docker compose -f infra/compose/docker-compose.dev.yml logs -f frontend
docker compose -f infra/compose/docker-compose.dev.yml logs -f backend
docker compose -f infra/compose/docker-compose.dev.yml logs -f ai-service
docker compose -f infra/compose/docker-compose.dev.yml logs -f postgres
```

### 7.4 현재 확인 주소
- frontend: `http://localhost:5173`
- backend health: `http://localhost:8080/actuator/health`
- backend test API: `http://localhost:8080/api/hello`
- backend → ai-service health proxy: `http://localhost:8080/api/integration/ai-health`
- ai-service health: `http://localhost:8000/health`
- ai-service docs: `http://localhost:8000/docs`

---

## 8. 팀별 권장 작업 방식

### 8.1 프론트엔드 팀 (FE)
- 수정 중심: `apps/frontend`
- 해야 할 일: 업로드 화면, 결과 조회 화면, 상태 표시, backend API 연동
- 주의:
  - `/api` prefix 기준으로 backend 호출
  - `node_modules` 커밋 금지
  - UI mock보다 실제 backend 응답 우선

### 8.2 백엔드 팀 (BE)
- 수정 중심: `apps/backend`
- 해야 할 일:
  - frontend와 ai-service 사이 오케스트레이션
  - 업로드 / 분석 요청 / 결과 저장 / 상태관리 API 설계
  - `packages/contracts`에 request/response 문서화
- 주의: AI 서비스가 직접 DB를 건드리지 않게 유지하고, backend가 단일 진입점 역할을 맡아야 함

### 8.3 AI 팀 (AI)
- 수정 중심: `apps/ai-service`
- 해야 할 일: `/predict`, 결과 JSON 스키마 고정, 추론 파이프라인 구현, Grad-CAM 산출물 생성
- 주의:
  - 학습 코드와 서비스 코드는 분리
  - 체크포인트/로그/생성물은 `artifacts/` 아래 유지
  - 모델 버전과 threshold 버전을 응답에 포함할 수 있게 설계

---

## 9. Git 리포 운영 규칙

### 9.1 브랜치 전략
- `main`: 항상 공유 가능한 상태
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `docs/*`: 문서 작업
- `refactor/*`: 구조 개편

예시:
- `feature/frontend-upload-page`
- `feature/backend-analysis-api`
- `feature/ai-predict-endpoint`
- `docs/team-guide-update`

### 9.2 기본 원칙
- `main`에서 직접 개발하지 않는다.
- 작업 전에는 항상 최신 `main`을 pull 한다.
- 새 작업은 기능 브랜치를 따서 진행한다.
- 완료 후 PR로 병합한다.
- 구조 변경은 반드시 공유한다.

### 9.3 기본 흐름

```bash
git checkout main
git pull origin main
git checkout -b feature/내작업이름
# 작업 진행...
git add .
git commit -m "feat: 작업 설명"
git push origin feature/내작업이름
```

### 9.4 커밋하면 안 되는 것
- `node_modules`
- `.venv`
- `apps/ai-service/artifacts`
- 대용량 모델 파일
- 민감정보가 들어간 `.env`
- 임시 개인 실험 파일
- `build/`
- 로그 산출물
- 로컬 캐시 파일

---

## 10. 팀원이 처음 리포를 받았을 때 해야 할 일

### 10.1 클론

```bash
git clone https://github.com/Laplace-tech/capstone-cxr.git
cd capstone-cxr
```

### 10.2 최신 main 동기화

```bash
git pull origin main
```

### 10.3 새 브랜치 생성

```bash
git checkout -b feature/작업이름
```

### 10.4 개발
- frontend 팀: `apps/frontend`
- backend 팀: `apps/backend`
- ai 팀: `apps/ai-service`

### 10.5 실행

```bash
docker compose -f infra/compose/docker-compose.dev.yml up --build -d
```

---

## 11. GitHub 리포 협업 방식

### 11.1 현재 운영 상태
현재 `capstone-cxr` 저장소는 퍼블릭(public) 상태로 운영 중이며, 팀원들은 collaborator로 초대된 상태에서 협업합니다.

### 11.2 현재 권장 방식
- 퍼블릭 리포 유지
- 팀원 전원 collaborator 권한으로 참여
- `main` 직접 push 금지
- 기능 브랜치 + PR 기반 병합
- 리드는 리포 구조/규칙 변경 시 공지

### 11.3 퍼블릭 리포 운영 시 주의사항
- 비밀키, 비밀번호, API key 절대 업로드 금지
- 실제 환자 데이터나 민감한 의료 이미지 업로드 금지
- 모델 가중치 파일, 로그, 대용량 산출물 업로드 금지
- `.env` 파일 절대 커밋 금지

### 11.4 팀원이 미리 공유해야 하는 것
- GitHub username
- 담당 역할 (FE / BE / AI)
- 작업 브랜치명
- API 변경 여부

---

## 12. 팀 공지용 짧은 메시지 예시

```text
capstone-cxr 리포 초기 세팅이 완료되었습니다.
현재 React / Spring Boot / FastAPI / PostgreSQL이 Docker Compose로 함께 기동되는 상태까지 확인했습니다.
frontend ↔ backend, backend ↔ ai-service 최소 통신도 검증 완료했습니다.
이제부터는 각자 기능 브랜치를 따서 작업하고, 작업 완료 후 PR로 병합하는 방식으로 진행합니다.
최신 main을 pull 받은 뒤 브랜치를 생성해 작업을 시작해주세요.
```

---

## 13. 다음 우선순위

### 공통
- `packages/contracts`에 API 계약서 작성
- 리포 운영 규칙 공유
- 역할 분리 확정
- `.gitignore` 점검

### frontend
- 업로드 화면
- 결과 화면 초안
- 상태 표시 컴포넌트

### backend
- 업로드 API
- 분석 요청 API
- 상태 조회 API
- 결과 저장 구조

### ai-service
- `/predict` 더미 응답
- 결과 스키마 확정
- Grad-CAM 더미 생성
- 기존 학습 코드 이식 계획 정리

---

## 14. 결론

현재 `capstone-cxr`는 다음과 같이 실제 팀 개발이 가능한 시작점입니다.

- 리포 구조가 정리돼 있고
- 앱 3개 골격이 살아 있고
- compose로 4개 서비스가 함께 뜨며
- frontend ↔ backend, backend ↔ ai-service 통신까지 검증됨

지금부터 중요한 것은 다음 네 가지입니다.

1. 구조를 다시 망가뜨리지 않는 것
2. 역할별로 분리해서 작업하는 것
3. API 계약서를 먼저 정리하는 것
4. PR 기반으로 안정적으로 병합하는 것
