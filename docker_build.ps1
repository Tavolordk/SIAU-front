param(
    [string]$Tag = "latest",
    [string]$Repo = "docker.io/USER/osusuarios-angular",  # e.g., docker.io/tavoolea29/osusuarios-angular
    [string]$Dockerfile = "Dockerfile",
    [string]$BuildConfiguration = "production",
    [string]$Context = "."
)
$ErrorActionPreference = "Stop"

$img = "${Repo}:${Tag}"
Write-Host "=== Building $img (Angular) ===" -ForegroundColor Cyan

docker build `
  --build-arg BUILD_CONFIGURATION=$BuildConfiguration `
  -f $Dockerfile -t $img $Context

if ($LASTEXITCODE -ne 0) { throw "Build failed for $img" }

Write-Host "Built $img" -ForegroundColor Green
Write-Host "Run it with: docker run -d -p 4200:80 $img" -ForegroundColor Yellow
