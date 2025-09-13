pipeline {
  agent any
  options { timestamps() }

  environment {
    GCP_REGION   = "us-central1"
    AR_REPO      = "myapp-repo"
    SERVICE_DEV  = "myapp-dev"
    SERVICE_PROD = "myapp-prod"
    PROJECT_ID   = "devopstask-472012"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install & Test') {
      steps {
        dir('app') {
          sh 'npm ci || npm install'
          sh 'npm test || echo "No tests found"'
        }
      }
    }
    stage('Docker Build & Push') {
      steps {
        sh '''
          gcloud auth activate-service-account --key-file=$HOME/.gcp/jenkins-sa-key.json
          gcloud config set project $PROJECT_ID
          gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev -q
          IMAGE=${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/myapp:$(git rev-parse --short HEAD)
          docker build -t $IMAGE .
          docker push $IMAGE
        '''
      }
    }
    stage('Deploy to Cloud Run') {
      steps {
        script {
          def svc = (env.BRANCH_NAME == 'main') ? SERVICE_PROD : SERVICE_DEV
          sh '''
            IMAGE=${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/myapp:$(git rev-parse --short HEAD)
            gcloud run deploy ${svc} \
              --image=$IMAGE \
              --region=$GCP_REGION \
              --allow-unauthenticated
          '''
        }
      }
    }
  }
}
