# 🧠 Lambda Image Analyzer with Worker Threads and AWS CDK

This project implements a serverless image analysis pipeline for insurance claim processing. It uses AWS Rekognition to detect image quality and damage, groups similar images using hash comparison, and selects the best representative images per damage area. The architecture is optimized with worker threads for image processing.


## 📦 Project Structure

├── iac/ # Infrastructure-as-Code using AWS CDK (TypeScript)
│ └── package.json
├── src/ # Lambda function code and image processing logic
│ └── package.json
└── README.md

## 🚀 One-Command Deployment

Prerequisites
Node.js ≥ 16
AWS CLI configured
AWS CDK v2 installed

This script automates the installation of all dependencies and deploys your stack.

```bash
npm run one-deploy
```

## How test
Change <your_url> for the url returned by "npm run one-deploy"

```bash
curl -X POST <your_url>/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "CLM-2025-00123",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "loss_type": "wind"
  }'
```
## 🧹 Teardown

For delete all cdk resources

```bash
cd iac
cdk destroy
```

## Assumptions


For testing purposes, the images in the provided ZIP were uploaded to a public S3 bucket I created. However, the test can and should be performed with any public image.
