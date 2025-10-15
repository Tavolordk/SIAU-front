#!/usr/bin/env bash
set -euo pipefail

TAG="${TAG:-latest}"
REPO="${REPO:-docker.io/USER/osusuarios-angular}"  # e.g., docker.io/tavoolea29/osusuarios-angular
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
BUILD_CONFIGURATION="${BUILD_CONFIGURATION:-production}"
CONTEXT="${CONTEXT:-.}"

IMG="${REPO}:${TAG}"
echo "=== Building ${IMG} (Angular) ==="

docker build \
  --build-arg BUILD_CONFIGURATION="${BUILD_CONFIGURATION}" \
  -f "${DOCKERFILE}" -t "${IMG}" "${CONTEXT}"

echo "Built ${IMG}"
echo "Run it with: docker run -d -p 4200:80 ${IMG}"
