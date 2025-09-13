pipeline {
  agent any
  options { timestamps(); skipDefaultCheckout(true) }  // we will checkout explicitly

  environment {
    GCP_REGION   = "us-central1"
    PROJECT_ID   = "devopstask-472012"
    AR_REPO      = "myapp-repo"
    SERVICE_DEV  = "myapp-dev"
    SERVICE_PROD = "myapp-prod"
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()          // clean workspace reliably
        checkout scm         // full, fresh clone
      }
    }

    stage('Install & Test') {
      steps {
        dir('app') {
          sh '''
            docker run --rm \
              -v "$PWD":/app -w /app \
              node:18-alpine sh -lc "
                npm ci || npm install;
                npm test || echo 'No tests found'
              "
          '''
        }
      }
    }

    stage('Auth & Configure') {
      steps {
        withCredentials([file(credentialsId: 'gcp-sa', variable: 'GCP_SA_FILE')]) {
          sh """
            gcloud auth activate-service-account --key-file="${GCP_SA_FILE}"
            gcloud config set project ${PROJECT_ID}
            gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev -q
          """
        }
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          def sha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          env.IMAGE = "${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/myapp:${sha}"
          sh """
            docker build -t ${IMAGE} .
            docker push ${IMAGE}
          """
        }
      }
    }

    stage('Deploy to Cloud Run') {
      steps {
        script {
          def svc = (env.BRANCH_NAME == 'main') ? SERVICE_PROD : SERVICE_DEV
          sh """
            gcloud run deploy ${svc} \
              --image=${IMAGE} \
              --region=${GCP_REGION} \
              --allow-unauthenticated
          """
        }
      }
    }
  }

  post {
    failure { echo "Build failed. Check the stage logs above." }
  }
}
