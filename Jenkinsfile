pipeline {
  agent any
  options { timeout(time: 30, unit: 'MINUTES') }

  environment {
    PROJECT_ID = 'devopstask-472012'
    REGION     = 'us-central1'
    REPO       = 'myapp-repo'
    IMAGE_NAME = 'myapp'
    SERVICE_DEV  = 'myapp-dev'
    SERVICE_MAIN = 'myapp'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        checkout([$class: 'GitSCM',
          userRemoteConfigs: [[url: 'https://github.com/Yuvraj-Dixit6265/devops-task.git', credentialsId: 'github-pat']],
          branches: [[name: "*/${env.BRANCH_NAME}"]]
        ])
        sh 'git --version'
      }
    }

    stage('GCP Auth') {
      steps {
        withCredentials([file(credentialsId: 'gcp-sa', variable: 'GCP_SA_FILE')]) {
          sh """
            gcloud auth activate-service-account --key-file="${GCP_SA_FILE}"
            gcloud config set project ${PROJECT_ID}
            gcloud config set run/region ${REGION}
            gcloud auth configure-docker ${REGION}-docker.pkg.dev -q
          """
        }
      }
    }

stage('Docker Build') {
  steps {
    sh '''
      COMMIT=$(git rev-parse --short HEAD)
      IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${COMMIT}"
      echo "$IMAGE" > image.txt
      echo "Building $IMAGE (linux/amd64)"
      docker build --no-cache --pull --platform=linux/amd64 -t "$IMAGE" .
    '''
  }
}


    stage('Local Smoke Test (8081->8080)') {
      steps {
        sh '''
          IMAGE=$(cat image.txt)
          CID=""
          set -e
          # run container mapping host 8081 to container 8080 (Cloud Run also uses 8080)
          CID=$(docker run -d -e PORT=8080 -p 8081:8080 "$IMAGE")
          echo "Started $CID; waiting for app..."
          for i in $(seq 1 20); do
            sleep 1
            if curl -fsS http://localhost:8081/ >/dev/null; then
              echo "Smoke test OK"
              break
            fi
            if [ "$i" -eq 20 ]; then
              echo "Smoke test FAILED"; docker logs "$CID" || true; exit 1
            fi
          done
          docker rm -f "$CID" >/dev/null 2>&1 || true
        '''
      }
    }

    stage('Docker Push') {
      steps {
        sh '''
          IMAGE=$(cat image.txt)
          docker push "$IMAGE"
        '''
      }
    }

    stage('Deploy to Cloud Run') {
      steps {
        sh '''
          IMAGE=$(head -n1 image.txt)
          if [ "${BRANCH_NAME}" = "main" ]; then
            SVC="${SERVICE_MAIN}"
          else
            SVC="${SERVICE_DEV}"
          fi
          echo "Deploying ${SVC} with ${IMAGE} in ${REGION}"
          gcloud run deploy "${SVC}" \
            --image="${IMAGE}" \
            --region="${REGION}" \
            --allow-unauthenticated \
            --port=8080
        '''
      }
    }
  }

  post {
    always {
      sh '''
        echo "== Debug =="
        docker --version || true
        gcloud --version || true
      '''
    }
  }
}
