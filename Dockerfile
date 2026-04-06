# Multi-stage build for Java + Node.js app
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY backend/pom.xml backend/
COPY backend/src backend/src
RUN mvn -f backend/pom.xml clean package -DskipTests

FROM node:18 AS frontend-build
WORKDIR /app
COPY frontend/package*.json frontend/
RUN npm ci
COPY frontend/ frontend/
RUN npm run build

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
COPY --from=frontend-build /app/frontend/dist frontend/
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]