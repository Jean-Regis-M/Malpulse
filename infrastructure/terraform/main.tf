steps:
  # 1. Build the production backend container image using Dockerfile
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/mallpulse-backend:$COMMIT_SHA',
      '-t', 'gcr.io/$PROJECT_ID/mallpulse-backend:latest',
      './backend'
    ]

  # 2. Build the FastMCP Remote Tool-Calling container image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/mallpulse-mcp-server:$COMMIT_SHA',
      '-t', 'gcr.io/$PROJECT_ID/mallpulse-mcp-server:latest',
      '-f', './backend/src/mcp_server/Dockerfile',
      './backend'
    ]

  # 3. Push both container images to Google Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mallpulse-backend:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mallpulse-mcp-server:$COMMIT_SHA']

  # 4. Deploy primary orchestrator service directly to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', 'mallpulse-orchestrator',
      '--image', 'gcr.io/$PROJECT_ID/mallpulse-backend:$COMMIT_SHA',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated'
    ]

images:
  - 'gcr.io/$PROJECT_ID/mallpulse-backend:latest'
  - 'gcr.io/$PROJECT_ID/mallpulse-mcp-server:latest'
