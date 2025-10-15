# Angular Dockerization Kit

Build a production image for your Angular app using **Node 20 (build)** and **Nginx (runtime)**.

## How to use
1. Copy all files into your Angular project root (same folder as `package.json`).
2. Build:
   - PowerShell:
     ```powershell
     .\docker_build.ps1 -Repo docker.io/tavoolea29/osusuarios-angular -Tag latest -BuildConfiguration production
     ```
   - Bash:
     ```bash
     REPO=docker.io/tavoolea29/osusuarios-angular TAG=latest ./docker_build.sh
     ```
3. Run locally:
   ```bash
   docker run -d -p 4200:80 docker.io/tavoolea29/osusuarios-angular:latest
   # http://localhost:4200
   ```
4. With Compose:
   - Copy `.env.example` to `.env` and adjust values.
   - `docker compose up -d --build`
5. Push:
   ```bash
   docker push docker.io/tavoolea29/osusuarios-angular:latest
   ```

## Notes
- Supports Angular v17+ output structure (`dist/<app>/browser`). The Dockerfile auto-detects it.
- If your build script differs, edit the `npm run build` line.
- For runtime config (changing envs without rebuild), consider an `env.js` injection approach; this kit focuses on build-time envs.
Generated: 2025-10-13T16:20:01.183242Z
