# Multi-stage build for Java + Node.js app
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY backend/pom.xml backend/
COPY backend/src backend/src
RUN mvn -f backend/pom.xml clean package -DskipTests

FROM node:18 AS frontend-build
WORKDIR /app
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_STORAGE_BUCKET=chat-uploads
ARG VITE_API_BASE_URL

COPY frontend/package*.json frontend/
RUN npm install
COPY frontend/ frontend/

# Create .env file for build
RUN echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > frontend/.env && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> frontend/.env && \
    echo "VITE_SUPABASE_STORAGE_BUCKET=${VITE_SUPABASE_STORAGE_BUCKET}" >> frontend/.env && \
    echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> frontend/.env

RUN npm run build

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
COPY --from=frontend-build /app/frontend/dist frontend/
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]