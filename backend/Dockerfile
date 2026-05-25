FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY gradle gradle
COPY gradlew gradlew.bat build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew
COPY src ./src
RUN ./gradlew clean bootJar -x test --no-daemon

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S monigroup && adduser -S moniuser -G monigroup
USER moniuser
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]