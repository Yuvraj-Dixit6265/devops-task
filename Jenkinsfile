pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
    skipDefaultCheckout(true)
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    // === EDIT THESE IF NEEDED ===
    PROJECT_ID   = "devopstask-472012"
    GCP_REGION   = "us-central1"
    AR_REPO      = "myapp-repo"     // Artifact Registry repo name (Docker)
    SERVICE_DEV  = "myapp-dev"      // Cloud Run service for dev branch
    SERVICE_PROD = "myapp-prod"     // Cloud Run service for main branch
    // =============================
  }

  stages {

    stage('Checkout') {
      steps {
        deleteDir()
        checkout scm
        sh 'git --version'
      }
    }

    stage('Verify app layout') {
      steps {
        sh '''
          if [ ! -f app/package.json ]; then
            echo "ERROR: app/package.json not found. Make sure your Node app is under ./app"
            exit 1
          fi
        '''
      }
    }

    stage('Install & Test (node:18-alpine)') {
      steps {
        dir('app') {
          // Run npm steps inside an official Node container; no Node install on Jenkins needed
          sh '''
            docker run --rm \
              -v "$PWD":/app -w /app \
              node:18-alpine sh -lc "
                if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
                  npm ci || npm install
                else
                  npm install
                fi
                npm test || echo 'No tests found'
              "
          '''
        }
      }
    }

    stage('GCP Auth & Docker Config') {
      steps {
        withCredentials([file(credentialsId: 'gcp-sa', variable: 'GCP_SA_FILE')]) {
          // Use single-quoted heredoc so the secret path isn't Groovy-interpolated
          sh '''
            gcloud --version || true
            gcloud auth activate-service-account --key-file="$GCP_SA_FILE"
            gcloud config set project '"$PROJECT_ID"'
            gcloud config set run/region '"$GCP_REGION"'
            gcloud auth configure-docker '"$GCP_REGION"'-docker.pkg.dev -q
          '''
        }
      }
    }

    stage('Docker Build') {
      environment {
        GIT_SHA = "${sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()}"
      }
      steps {
        sh '''
          IMAGE="${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/myapp:${GIT_SHA}"
          echo "Building image: $IMAGE"
          docker build -t "$IMAGE" .
          echo "$IMAGE" > image.txt
        '''
      }
    }

    stage('Docker Push') {
      steps {
        sh '''
          IMAGE="$(cat image.txt)"
          docker push "$IMAGE"

          # On main, also tag & push :latest
          if [ "$BRANCH_NAME" = "main" ]; then
            LATEST="${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/myapp:latest"
            docker tag "$IMAGE" "$LATEST"
            docker push "$LATEST"
            echo "$LATEST" >> image.txt
          fi
        '''
      }
    }

    stage('Deploy to Cloud Run') {
      steps {
        sh '''
          IMAGE="$(head -n1 image.txt)"
          if [ "$BRANCH_NAME" = "main" ]; then
            SVC="${SERVICE_PROD}"
          else
            SVC="${SERVICE_DEV}"
          fi

          echo "Deploying ${SVC} with image ${IMAGE} in ${GCP_REGION}"
          gcloud run deploy "$SVC" \
            --image="$IMAGE" \
            --region="$GCP_REGION" \
            --allow-unauthenticated

          echo "Describe service URL:"
          gcloud run services describe "$SVC" --region="$GCP_REGION" --format='value(status.url)' | tee deploy-url.txt
        '''
      }
    }
  }

  post {
    success {
      sh 'echo "Deployed URL: $(cat deploy-url.txt 2>/dev/null || echo N/A)"'
      archiveArtifacts artifacts: 'image.txt,deploy-url.txt', onlyIfSuccessful: true
    }
    failure {
      echo "Build failed. Check the stage logs above."
    }
    always {
      // Optional: show a few useful versions for debugging
      sh '''
        echo "== Debug info =="
        docker --version || true
        gcloud --version || true
      '''
    }
  }
}
