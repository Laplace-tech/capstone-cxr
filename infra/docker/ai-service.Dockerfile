
FROM python:3.11-slim

# 컨테이너 내부 작업 디렉터리를 /app 으로 설정
WORKDIR /app 

# 의존성 목록 파일(requirements.txt)를 복사 후, Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 현재 디렉터리의 전체 파일을 컨테이너 /app으로 복사
# 여기에는 src/, README, 설정 파일 등 현재 build context에 포함된 내용이 들어간다
COPY . .

# Python이 모듈을 import할 때 /app/src를 경로에 포함시키도록 설정
# 그래서 ai_service.api.main 같은 패키지 import가 가능
ENV PYTHONPATH=/app/src

# 컨테이너가 8000 포트를 사용함을 문서적으로 표시
# 실제 외부 노출은 docker-compose의 ports 설정이 담당
EXPOSE 8000

# 컨테이너 시작 시 실행할 기본 명령
# uvicorn으로 FastAPI 앱(ai_service.api.main:app)을
# 0.0.0.0:8000에서 실행한다
CMD ["uvicorn", "ai_service.api.main:app", "--host", "0.0.0.0", "--port", "8000"]