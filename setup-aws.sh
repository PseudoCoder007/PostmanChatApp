#!/bin/bash

# AWS Setup Script for Postman Chat
# Run this after creating your AWS account and GitHub repository

echo "🚀 Postman Chat AWS Setup Script"
echo "================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Get AWS region
read -p "Enter your AWS region (e.g., us-east-1): " AWS_REGION
aws configure set region $AWS_REGION

# Create ECR repository
echo "📦 Creating ECR repository..."
REPO_NAME="postman-chat"
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "✅ ECR repository created: $REPO_URI"
echo ""
echo "📋 Next steps:"
echo "1. Copy this repository URI to your GitHub secrets as ECR_REPOSITORY"
echo "2. Create an IAM user with the required permissions"
echo "3. Add AWS credentials to GitHub secrets"
echo "4. Push your code to GitHub main branch"
echo ""
echo "Repository URI: $REPO_URI"