# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

EXPOSE 8081

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8081
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=50.0 -XX:InitialRAMPercentage=20.0 -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=64m -Xss512k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-jar", "app.jar"]
