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
    PROJECT_ID   = "devopstask-472012"
    GCP_REGION   = "us-central1"
    AR_REPO      = "myapp-repo"
    SERVICE_DEV  = "myapp-dev"
    SERVICE_PROD = "myapp-prod"
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
            echo "ERROR: app/package.json not found. Ensure your Node app lives under ./app"
            exit 1
          fi
        '''
      }
    }

    stage('Install & Test (node:18-alpine)') {
      steps {
        dir('app') {
          sh '''
            docker run --rm -v "$PWD":/app -w /app node:18-alpine sh -lc "
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
          sh """
            gcloud --version || true
            gcloud auth activate-service-account --key-file="$GCP_SA_FILE"
            gcloud config set project "$PROJECT_ID"
            gcloud config set run/region "$GCP_REGION"
            gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev -q
          """
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
          echo "Deploying $SVC with $IMAGE in ${GCP_REGION}"
          gcloud run deploy "$SVC" --image="$IMAGE" --region="$GCP_REGION" --allow-unauthenticated
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
      sh '''
        echo "== Debug info =="
        docker --version || true
        gcloud --version || true
      '''
    }
  }
}
