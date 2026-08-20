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

ENTRYPOINT ["java", "-jar", "app.jar"]
