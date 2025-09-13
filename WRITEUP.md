# DevOps Assignment – Write-up

## Tools & Services Used
- **GitHub**: Hosted source code repository.  
- **Jenkins**: Automated CI/CD pipeline, running inside a Docker container.  
- **Docker**: Built containerized Node.js application.  
- **Google Artifact Registry**: Stored built Docker images.  
- **Google Cloud Run**: Deployed container image and served app publicly.  
- **Express.js**: Simple Node.js web server for serving static content.

## Challenges Faced & Solutions
- **Docker socket permission issues in Jenkins**  
  → Solved by running Jenkins container with correct `--group-add` to match docker.sock GID.  
- **Cloud Run deployment failure due to wrong port**  
  → Fixed by updating app.js to listen on `process.env.PORT` (8080 in Cloud Run).  
- **npm install errors (missing package.json in Jenkins pipeline)**  
  → Adjusted Dockerfile to `COPY app/package*.json` and ensured project structure matched.  

## Possible Improvements
- Add **automated unit tests** to Jenkins pipeline instead of skipping tests.  
- Implement **branch-based deployments** (e.g., `dev` → staging service, `main` → prod).  
- Configure **monitoring/logging** via Google Cloud Logging and Alerts.  
- Add **Infrastructure as Code** (Terraform/Cloud Deployment Manager) for reproducible GCP setup.  
