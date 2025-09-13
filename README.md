# DevOps CI/CD Assignment

## Overview
This project demonstrates a complete CI/CD pipeline for a Node.js application using **Jenkins**, **Docker**, and **Google Cloud Run**.

The pipeline:
1. Builds a Node.js app (Express) that serves a PNG logo.
2. Containerizes the app using Docker.
3. Pushes the image to **Google Artifact Registry**.
4. Deploys the container to **Google Cloud Run** with Jenkins pipeline automation.

---

## Repository Structure
devops-assignment/
│── app/
│ ├── app.js
│ ├── package.json
│ └── logoswayatt.png
│── Dockerfile
│── Jenkinsfile
│── .dockerignore
└── README.md


---

## CI/CD Pipeline Flow
1. **Checkout**: Fetch latest code from GitHub.
2. **Docker Build**: Build app image with `docker build`.
3. **Docker Push**: Push image to Artifact Registry.
4. **Deploy**: Deploy image to Google Cloud Run.

---

## Deployment Details
- **Service Name:** `myapp-dev`
- **Region:** `us-central1`
- **Artifact Registry:** `us-central1-docker.pkg.dev/devopstask-472012/myapp-repo/myapp`
- **Service URL:** `https://myapp-dev-582336748277.us-central1.run.app`


---

## Local Setup
To test locally:

```bash
# Clone repo
git clone https://github.com/Yuvraj-Dixit6265/devops-task.git
cd devops-task

# Build Docker image
docker build -t myapp-test .

# Run container on port 8081
docker run -p 8081:8080 myapp-test

# Test
curl http://localhost:8081
