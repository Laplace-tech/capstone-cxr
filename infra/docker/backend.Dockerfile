# 1) 빌드 스테이지: 
# Spring Boot 프로젝트를 컴파일하고 jar를 만드는 단계
FROM eclipse-temurin:21-jdk AS build

# 컨테이너 내부 작업 디렉터리 설정
WORKDIR /app

# 현재 프로젝트 전체를 /app으로 복사
# gradlew, build.gradle, settings.gradle, src/ 등이 포함된다
COPY . .

# gradlew 실행 권한 부여 후 bootJar 빌드 수행
# 결과적으로 build/libs 아래에 실행 가능한 Spring Boot jar 생성
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

# 2) 실행 스테이지:
# 실제 실행에는 JDK 전체가 아니라 JRE만 사용
# 빌드 도구를 제외해서 최종 이미지 크기를 줄이는 목적
FROM eclipse-temurin:21-jre

# 실행용 컨테이너 작업 디렉터리
WORKDIR /app

# 빌드 스테이지에서 생성한 jar 파일을 현재 이미지로 복사
# 이름은 app.jar로 통일
COPY --from=build /app/build/libs/*.jar app.jar

# 애플리케이션이 사용하는 포트 명시
EXPOSE 8080

# 컨테이너 시작 시 Spring Boot jar 실행
CMD ["java", "-jar", "app.jar"]
