# Postman Quest Chat

Postman Quest Chat is a realtime social messaging app built with React, Spring Boot, and Supabase. It combines room chat, friend-gated direct messaging, quests, coins, levels, notifications, leaderboard features, and an unlockable Igris AI console in a single app.

## Highlights

- Realtime messaging over WebSockets
- Animated command-deck UI with route transitions and gaming-style panel motion
- Group rooms with unique names
- Direct messaging only after friend request acceptance
- Search for people and rooms
- Unique usernames and editable profiles
- Supabase Storage uploads for images, videos, and documents with backend fallback
- 50 MB upload warning and server-side validation
- In-app notifications for inactive recipients plus browser notifications
- Optional SMTP email notifications for inactive recipients
- Presence indicator based on recent activity heartbeat and periodic refresh
- Toast-based success and failure feedback across auth and chat actions
- Optional UI sounds for sends, alerts, and live activity
- XP, coins, levels, titles, random quests, friend quests, Igris unlocks, and global leaderboard

## Recent Updates

### v0.0.1 (Latest)

- **Attachment Upload Improvements**: Added robust fallback mechanism where uploads first attempt Supabase Storage, then fall back to backend file storage if Supabase fails
- **Cross-User Attachment Access**: Fixed attachment URLs to use full base URLs instead of relative paths, ensuring attachments are accessible to all chat participants
- **CORS Configuration**: Extended CORS support to include upload endpoints for better cross-origin resource sharing
- **Environment Configuration**: Added `STORAGE_BASE_URL` environment variable for configurable base URL in different deployment environments
- **Error Handling**: Improved upload error handling with user-friendly messages and better fallback logic

## Tech stack

- Frontend: React 18, TypeScript, Vite, TanStack Query, Motion, Sonner
- Backend: Spring Boot 3, Java 21, Spring Security, STOMP WebSocket, JavaMail
- Auth and database: Supabase Auth, Supabase Postgres
- File storage: Supabase Storage
- Migrations: Flyway

## How it works

### Authentication

The frontend uses Supabase Auth for sign up and sign in. After login, the browser sends the Supabase JWT to the Spring Boot backend on API requests.

### Messaging

- Group rooms are created through the backend and room names must be unique.
- Direct chats are only allowed between accepted friends.
- Messages are persisted in Postgres.
- Realtime updates are delivered through STOMP over WebSocket.

### Social layer

- Every user has a unique username.
- Users can send and accept friend requests.
- Presence is updated through a heartbeat endpoint while the app is open.
- Notifications are stored server-side and shown in the UI.
- Friend and profile presence are refreshed periodically on the frontend.

### Gamification

- Sending messages grants small XP and coin rewards.
- Users can generate random quests.
- Completing quests grants larger rewards.
- Coins unlock profile photo usage, Igris access, and friend quest sending.
- Global leaderboard ranks users by XP.

### Attachments

- Files are uploaded from the authenticated frontend session to Supabase Storage with fallback to backend file upload.
- The backend registers attachment metadata and links it to messages.
- Images and videos render inline when possible.
- Other file types are shown as downloadable links.
- Backend-uploaded files use full URLs for cross-user accessibility.
- CORS is configured for both API and upload endpoints.

## Main features

### Realtime chat

- Group room chat
- Friend-only direct messages
- Message history loading
- Live updates without refresh
- Optional game-style UI sounds for sends and incoming activity
- Animated chat surfaces and room switching

### Profiles and friends

- Editable display name
- Unique username
- Optional profile photo
- Friend requests
- Accepted-friend messaging gate
- Presence state

### Quests and progression

- XP, coins, levels, titles
- Random quests
- Igris-generated quests and AI chat console
- Friend challenge quests
- Global leaderboard

### Notifications

- In-app notifications for unread activity
- Browser notifications when the tab is backgrounded and permission is granted
- Optional SMTP email notifications for inactive recipients
- Toast notifications for successful and failed actions

## Project structure

```text
PostWebAppforMessaging/
├── backend/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Environment variables

### Backend

Set these for Spring Boot:

```env
DATABASE_URL=jdbc:postgresql://db.<your-ref>.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=<your_database_password>
SUPABASE_JWT_ISSUER=https://<your-ref>.supabase.co/auth/v1
CORS_ORIGINS=http://localhost:5173
SERVER_PORT=8080
STORAGE_BASE_URL=http://localhost:8080
IGRIS_NVIDIA_API_URL=https://integrate.api.nvidia.com/v1/chat/completions
IGRIS_NVIDIA_API_KEY=<your_nvidia_api_key_here>
IGRIS_MODEL=meta/llama-3.1-70b-instruct

# Igris chat will only use the NVIDIA Integrate API when IGRIS_NVIDIA_API_KEY is set.
# Without it, the app falls back to canned Igris responses.
EMAIL_NOTIFICATIONS_ENABLED=false
EMAIL_FROM=no-reply@your-app.example
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

Example file: [backend/env.example](C:/Users/alisa/PostWebAppforMessaging/backend/env.example)

### Frontend

Set these in `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_PUBLIC_SITE_URL=https://postmanchat.live
VITE_API_BASE_URL=https://postmanchat.live
VITE_SUPABASE_STORAGE_BUCKET=chat-uploads
```

Example file: [frontend/env.example](C:/Users/alisa/PostWebAppforMessaging/frontend/env.example)

## Supabase setup

### 1. Create a project

Create a Supabase project and collect:

- Project URL
- Anon key
- Database password
- Project ref

### 2. Auth URLs and providers

Configure Supabase Auth before testing email confirmation, password reset, or OAuth:

- Set the Supabase Auth Site URL to your deployed frontend origin such as `https://your-frontend-domain.example.com`
- Add redirect URLs for `https://your-frontend-domain.example.com/login` and `https://your-frontend-domain.example.com/reset-password`
- Keep `VITE_PUBLIC_SITE_URL` in the frontend aligned with that same deployed frontend origin
- Enable the Google provider in Supabase Auth and set its callback URL in Google Cloud
- Enable the Facebook provider in Supabase Auth and set its callback URL in Meta for Developers
- Update the Supabase confirmation and password-reset email templates with your branded copy and links to the deployed app

The app intentionally keeps Supabase-hosted email delivery in place. Do not replace confirmation or reset emails with a custom backend mailer.

### 3. Storage bucket

Create a public Storage bucket named `chat-uploads` or change the frontend env var to match your chosen bucket.

### 4. Storage policy

You need a policy that allows authenticated users to upload files to the selected bucket. A minimal example:

```sql
create policy "authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-uploads');

create policy "public reads"
on storage.objects
for select
to public
using (bucket_id = 'chat-uploads');
```

Adjust policies to your security requirements before production use.

### 5. Auth flow notes

- Email signup confirmation should redirect back to `/login`
- Password reset emails should redirect back to `/reset-password`
- Google and Facebook OAuth should redirect back to `/login` so the frontend can complete the Supabase session and route the user into the app
- Backend-served `/uploads/...` attachments are resolved against `VITE_API_BASE_URL` in production and the Vite proxy in local development

## EC2 domain setup with Nginx and SSL

The repo includes an EC2 deployment workflow at [`.github/workflows/deploy-ec2.yml`](C:/Users/alisa/PostWebAppforMessaging/.github/workflows/deploy-ec2.yml), an Nginx template at [`deploy/nginx/postmanchat.live.conf.template`](C:/Users/alisa/PostWebAppforMessaging/deploy/nginx/postmanchat.live.conf.template), and a bootstrap script at [`deploy/ec2/setup-nginx-certbot.sh`](C:/Users/alisa/PostWebAppforMessaging/deploy/ec2/setup-nginx-certbot.sh).

Production traffic flow:

```text
GoDaddy DNS -> EC2 public IP -> Nginx -> Docker container on 127.0.0.1:8080
```

### 1. DNS records in GoDaddy

Create these A records:

- `@` -> `13.201.50.166`
- `www` -> `13.201.50.166`

### 2. EC2 security group

Allow these inbound ports:

- `80/tcp` for HTTP and Let's Encrypt validation
- `443/tcp` for HTTPS
- `22/tcp` only from your admin IP if possible

### 3. GitHub Actions secrets for EC2 deploy

Required secrets:

- `EC2_HOST`
- `EC2_SSH_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SUPABASE_JWT_ISSUER`

Recommended secrets:

- `LETSENCRYPT_EMAIL`
- `IGRIS_NVIDIA_API_KEY`
- `EMAIL_NOTIFICATIONS_ENABLED`
- `EMAIL_FROM`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_SMTP_AUTH`
- `MAIL_SMTP_STARTTLS`

### 4. What the EC2 workflow does

- Builds the frontend with `VITE_PUBLIC_SITE_URL=https://postmanchat.live`
- Builds the frontend with `VITE_API_BASE_URL=https://postmanchat.live`
- Runs the container on `127.0.0.1:8080` instead of exposing it publicly on port `80`
- Installs and configures Nginx on the EC2 instance
- Requests and installs a Let's Encrypt certificate when `LETSENCRYPT_EMAIL` is set
- Reloads Nginx after deployment

### 5. Supabase production URLs

Update Supabase Auth to use:

- Site URL: `https://postmanchat.live`
- Redirect URL: `https://postmanchat.live/login`
- Redirect URL: `https://postmanchat.live/reset-password`

If you support `www`, keep `https://www.postmanchat.live` redirected to `https://postmanchat.live`.

## Running locally

### Backend

From the repo root:

```powershell
cd C:\Users\alisa\PostWebAppforMessaging
$env:JAVA_HOME = "C:\Users\alisa\PostWebAppforMessaging\.tools\jdk-21\jdk-21.0.10+7"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Get-Content .\backend\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
}
& .\.tools\maven\apache-maven-3.9.9\bin\mvn.cmd -f .\backend\pom.xml spring-boot:run
```

Health check:

```text
http://localhost:8080/actuator/health
```

### Frontend

```powershell
cd C:\Users\alisa\PostWebAppforMessaging\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Build and test

### Backend tests

```powershell
& .\.tools\maven\apache-maven-3.9.9\bin\mvn.cmd -f .\backend\pom.xml test
```

### Frontend production build

```powershell
cd .\frontend
npm run build
```

### Testing Docker Build Locally

```bash
# Build the Docker image
docker build -t postman-chat .

# Run with docker-compose (recommended)
docker-compose up

# Or run directly
docker run -p 8080:8080 \
  -e DATABASE_URL="your_db_url" \
  -e DB_USERNAME="postgres" \
  -e DB_PASSWORD="your_password" \
  -e SUPABASE_JWT_ISSUER="your_issuer" \
  -e CORS_ORIGINS="http://localhost:5173" \
  -e STORAGE_BASE_URL="http://localhost:8080" \
  postman-chat
```

## AWS Hosting with Containers (Free Tier)

This guide shows how to host your app on AWS for free using containers and GitHub Actions.

### Prerequisites

- AWS account (free tier available)
- GitHub repository
- Docker installed locally

### Quick Setup Script (Linux/Mac)

Run `setup-aws.sh` to automate ECR repository creation:

```bash
chmod +x setup-aws.sh
./setup-aws.sh
```

### Step 1: Containerize the Application

Create a `Dockerfile` in the root directory:

```dockerfile
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
```

Create a `.dockerignore` file:

```
.git
.github
node_modules
backend/target
frontend/node_modules
*.md
```

### Step 2: Set up AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com) and create a free account
2. Verify your account and add a payment method (you won't be charged for free tier usage)
3. Go to IAM console and create a user with these permissions:
   - AmazonEC2ContainerRegistryFullAccess
   - AWSAppRunnerFullAccess
   - IAMFullAccess (for GitHub Actions)

### Step 3: Create ECR Repository

1. Go to Amazon ECR in AWS Console
2. Create a private repository named `postman-chat`
3. Note the repository URI (looks like `123456789012.dkr.ecr.us-east-1.amazonaws.com/postman-chat`)

### Step 4: Set up GitHub Secrets

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
   - `ECR_REPOSITORY`: Your ECR repository URI

### Step 5: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS App Runner

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Deploy to App Runner
      uses: awslabs/amazon-app-runner-deploy@main
      with:
        service: postman-chat
        image: ${{ steps.build.outputs.image }}
        port: 8080
        region: ${{ secrets.AWS_REGION }}
        cpu: 1
        memory: 2
        wait-for-service-stability: true
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DB_USERNAME: ${{ secrets.DB_USERNAME }}
        DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        SUPABASE_JWT_ISSUER: ${{ secrets.SUPABASE_JWT_ISSUER }}
        CORS_ORIGINS: ${{ secrets.CORS_ORIGINS }}
        STORAGE_BASE_URL: ${{ secrets.STORAGE_BASE_URL }}
        IGRIS_NVIDIA_API_KEY: ${{ secrets.IGRIS_NVIDIA_API_KEY }}
```

### Step 6: Add Environment Secrets to GitHub

Add these additional secrets to GitHub (from your `.env` files):

- `DATABASE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SUPABASE_JWT_ISSUER`
- `CORS_ORIGINS` (set to your App Runner URL after first deployment)
- `STORAGE_BASE_URL` (set to your App Runner URL after first deployment)
- `IGRIS_NVIDIA_API_KEY` (optional)

### Step 7: Deploy

1. Push your code to GitHub main branch
2. GitHub Actions will automatically build and deploy
3. Go to AWS App Runner console to see your service
4. Note the service URL (looks like `https://abc123xyz.us-east-1.awsapprunner.com`)

### Step 8: Update CORS and Storage URL

1. Update `CORS_ORIGINS` and `STORAGE_BASE_URL` secrets with your App Runner URL
2. Push the change to trigger a new deployment

### Step 9: Update Frontend Environment

Update your `frontend/.env` file:

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_API_BASE_URL=https://your-app-runner-url
VITE_SUPABASE_STORAGE_BUCKET=chat-uploads
```

### Cost Estimation

- **Free Tier**: Up to 5 million requests/month, 100 active services
- **App Runner**: ~$0.007 per GB-hour, ~$0.007 per vCPU-hour
- **ECR**: Free for first 500MB/month
- **Typical cost**: <$5/month for light usage

### Troubleshooting

- Check GitHub Actions logs for build errors
- Check AWS CloudWatch logs for runtime errors
- Ensure all environment variables are set correctly
- Verify Supabase policies allow your App Runner IP range

## Current unlock rules

- 5 coins: profile photo unlock
- 5 coins: Igris AI console unlock
- 10 coins: friend quest sending unlock
- 20 coins: group room creation cost

## API summary

### Core

- `GET /api/me`
- `PATCH /api/me`
- `POST /api/me/presence`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/{roomId}/messages`
- `POST /api/rooms/{roomId}/messages`

### Social

- `GET /api/profiles`
- `GET /api/friends`
- `POST /api/friends/{targetUserId}/request`
- `POST /api/friends/{otherUserId}/accept`

### Quests and leaderboard

- `GET /api/quests`
- `POST /api/quests/random`
- `POST /api/quests/{questId}/complete`
- `POST /api/quests/friends/{targetUserId}/random`
- `GET /api/leaderboard`

### Attachments and notifications

- `POST /api/attachments/register`
- `GET /api/notifications`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/igris/chat`

## Notes

- Browser notifications require notification permission.
- Direct chat requires accepted friendship.
- Uploads larger than 50 MB are rejected.
- The current notification system supports in-app notifications, browser background notifications, and optional SMTP email notifications for inactive recipients.
- Email delivery requires valid SMTP env vars and `EMAIL_NOTIFICATIONS_ENABLED=true`.
- Igris chat requires authentication and unlocks only after the user reaches 5 coins.

## Security notes

- Do not put the Supabase `service_role` key in the frontend.
- The frontend should only use the Supabase anon key.
- Protect storage policies appropriately before deploying publicly.

## License

MIT. See [LICENSE](C:/Users/alisa/PostWebAppforMessaging/LICENSE).
