# capstone-cxr 팀 킥오프 가이드

---

## 1. 문서 목적

이 문서는 `capstone-cxr` 서비스 개발을 본격적으로 시작하기 전에,  
현재 확정된 팀 구성과 1차 개발 목표, 그리고 각 팀이 바로 착수해야 할 작업을 정리한 킥오프 문서다.

이번 단계에서 가장 중요한 것은 **각 팀이 따로 큰 기능을 만드는 것**이 아니라,  
**이미지 1장 업로드 → 분석 요청 → AI 응답 → 결과 화면 표시**까지의 최소 end-to-end 흐름을 먼저 완성하는 것이다.

즉, 이번 1차 목표는 **“실제 서비스가 한 번 처음부터 끝까지 돌아가는 상태”를 만드는 것**이다.

---

## 2. 팀 구성 확정

현재 역할은 아래와 같이 확정한다.

- **FE**: 하윤진, 손세연
- **BE**: 송호성, 이용준
- **AI**: 박용민, 박지원

---

## 3. 이번 1차 개발 목표

### 핵심 목표
아래 흐름을 우선 완성한다.

1. frontend에서 이미지 1장 업로드
2. backend가 업로드 파일을 수신하고 분석 요청 생성
3. backend가 ai-service `/predict` 호출
4. ai-service가 정해진 JSON 형식으로 응답
5. backend가 결과를 frontend에 전달
6. frontend가 결과 화면 렌더링

### 현재 단계에서 중요한 점
- `/predict`는 **더미 응답이라도 먼저 동작하면 된다**
- 실제 모델 최적화보다 **서비스 흐름 고정**이 먼저다
- DB/인증/고급 UI보다 **최소 연결 완성**이 우선이다

---

## 4. 공통 개발 원칙

### 4.1 브랜치 운영
- `main` 직접 push 금지
- 기능별 브랜치 생성 후 작업
- 작업 완료 후 PR로 병합

### 4.2 계약 우선
- API 변경 전 `docs/api`와 `packages/contracts` 먼저 반영
- FE / BE / AI 모두 응답 스키마를 공유 기준으로 사용

### 4.3 퍼블릭 리포 주의사항
- `.env`
- API key / 비밀번호
- 실제 의료 데이터
- 모델 가중치 파일
- 로그 덤프
- 개인 실험 파일

위 항목은 절대 커밋하지 않는다.

### 4.4 생성물 커밋 금지
- `node_modules`
- `build`
- `artifacts`
- `.venv`
- 대용량 바이너리 파일

---

## 5. 팀별 역할과 1차 작업 범위

---

## 5.1 FE 팀 작업지시

담당: **하윤진, 손세연**

프론트엔드 팀의 1차 목표는 **사용자가 이미지를 올리고 분석 결과를 볼 수 있는 최소 화면 흐름**을 만드는 것이다.

### 필수 구현
- 이미지 업로드 화면
- 업로드 버튼 / 분석 요청 버튼
- 현재 상태 표시
  - `idle`
  - `uploading`
  - `queued`
  - `processing`
  - `completed`
  - `failed`
- 결과 화면 기본 렌더링
- 병변별 예측 결과 리스트 표시
- Grad-CAM 이미지 표시 영역 확보

### 연동 대상 API
- `POST /api/v1/analyses`
- `GET /api/v1/analyses/{analysisId}`
- `GET /api/v1/analyses/{analysisId}/result`

### 작업 원칙
- `/api` prefix 기준으로 backend 호출
- UI mock보다 실제 backend 응답 우선
- 디자인보다 연결과 흐름을 먼저 완성

### 브랜치 예시
- `feature/frontend_upload_flow`
- `feature/frontend_result_view`

### 1차 완료 기준
- 사용자가 이미지 선택 가능
- 업로드 후 분석 요청 가능
- 결과 JSON 기반 화면 렌더링 가능

---

## 5.2 BE 팀 작업지시

담당: **송호성, 이용준**

백엔드 팀의 1차 목표는 **frontend와 ai-service 사이의 단일 진입점이자 오케스트레이션 계층**을 만드는 것이다.

### 필수 구현 API
- `POST /api/v1/analyses`
- `GET /api/v1/analyses/{analysisId}`
- `GET /api/v1/analyses/{analysisId}/result`

### 각 API 역할

#### `POST /api/v1/analyses`
- 이미지 1장 수신
- 업로드 파일 저장
- `analysisId` 생성
- 초기 상태 저장
- ai-service `/predict` 호출
- 요청 수락 응답 반환

#### `GET /api/v1/analyses/{analysisId}`
- 현재 상태 조회
- 최소한 `queued / processing / completed / failed` 중 하나 반환

#### `GET /api/v1/analyses/{analysisId}/result`
- 최종 결과 반환
- 예측값, CAM 경로, 모델 버전 정보 포함

### 작업 원칙
- backend가 단일 진입점 유지
- AI 서비스가 직접 DB를 만지지 않게 유지
- 지금은 DB 과설계 금지
- 1차는 메모리 저장 또는 단순 구조여도 괜찮음
- 흐름이 먼저, 정교한 도메인은 나중

### 역할 분할 권장
- **송호성**: 분석 API, AI 연동, 상태 전이
- **이용준**: 파일 저장 구조, 결과 반환 DTO, 이후 DB 확장 뼈대

### 브랜치 예시
- `feature/backend_analysis_api`
- `feature/backend_result_api`

### 1차 완료 기준
- 프론트 요청을 받아 분석 작업 생성 가능
- `analysisId` 발급 가능
- AI 서비스 호출 가능
- 상태/결과 조회 응답 가능

---

## 5.3 AI 팀 작업지시

담당: **박용민, 박지원**

AI 팀의 1차 목표는 **실제 모델 성능 고도화가 아니라 서비스 가능한 추론 인터페이스를 먼저 고정하는 것**이다.

### 필수 구현
- `POST /predict`
- 이미지 1장 입력 수신
- 고정된 JSON 스키마 반환
- mock 예측값 반환
- mock Grad-CAM 경로 반환
- `modelVersion`, `thresholdVersion` 포함

### 현재 단계 원칙
- 더미 응답이어도 괜찮음
- 응답 형식이 먼저 고정되어야 함
- 실제 모델은 그 다음 단계에서 점진 이식
- `CheXpert` 리포의 train/eval 전체를 옮기지 말 것
- `capstone-cxr`에는 서비스 추론 코어만 반영

### 응답 최소 항목
- `status`
- `predictions`
- `cam.available`
- `cam.overlayPath`
- `modelInfo.modelVersion`
- `modelInfo.thresholdVersion`

### 역할 분할 권장
- **박용민**: 응답 스키마, 서비스 추론 구조, PoC 이식 기준 정리
- **박지원**: FastAPI `/predict` 구현, schema, mock CAM 처리

### 브랜치 예시
- `feature/ai_predict_endpoint`
- `feature/ai_response_schema`

### 1차 완료 기준
- backend가 `/predict` 호출 가능
- AI 서비스가 고정 JSON 형식 반환 가능
- FE가 그 결과를 화면에 표시 가능

---

## 6. 1차 API 기준안

### Backend 공개 API

#### `POST /api/v1/analyses`
분석 요청 생성

#### `GET /api/v1/analyses/{analysisId}`
분석 상태 조회

#### `GET /api/v1/analyses/{analysisId}/result`
분석 결과 조회

### AI 내부 API

#### `POST /predict`
이미지 입력을 받아 예측 결과를 반환

---

## 7. 1차 완료 시점의 성공 기준

아래가 전부 되면 1차 목표는 달성한 것이다.

- frontend에서 이미지 업로드 가능
- backend가 분석 요청 생성 가능
- ai-service가 `/predict` 응답 가능
- backend가 결과를 다시 정리해 전달 가능
- frontend가 결과와 Grad-CAM 영역을 렌더링 가능

즉, **더미라도 서비스가 한 번 끝까지 돌아가면 성공**이다.

---

## 8. 결론

현재 `capstone-cxr`의 1차 개발 목표는 **실제 DenseNet 성능 완성**이 아니라,  
**제품형 서비스의 최소 end-to-end 흐름을 먼저 살아 있게 만드는 것**이다.

이번 단계에서 가장 중요한 것은 다음 네 가지다.

1. 각 팀이 따로 놀지 않을 것
2. API 계약을 먼저 맞출 것
3. 더미라도 전체 흐름을 먼저 완성할 것
4. 실제 모델 이식은 그 다음 단계로 넘길 것

이 기준으로 바로 개발을 착수한다.