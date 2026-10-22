# ==============================================================================
# UniSIRAJ CIA Helpdesk Agent - Cloud Run Deployment Script (PowerShell)
# Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)
# ==============================================================================

$ErrorActionPreference = "Stop"

$PROJECT_ID = "unisiraj-cia-helpdesk-agent"
$SERVICE_NAME = "unisiraj-cia-helpdesk"
$REGION = "asia-southeast1"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deploying UniSIRAJ CIA Helpdesk Agent to Google Cloud Run" -ForegroundColor Cyan
Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Region:     $REGION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Check if Google Cloud CLI is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "`n[ERROR] 'gcloud' (Google Cloud CLI) is not installed or not recognized in your current PowerShell session." -ForegroundColor Red
    Write-Host "`nTo install Google Cloud CLI, run:" -ForegroundColor Yellow
    Write-Host "winget install --id Google.CloudSDK -e --accept-package-agreements --accept-source-agreements" -ForegroundColor White
    Write-Host "`nOr download the official Windows installer directly:" -ForegroundColor Yellow
    Write-Host "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe`n" -ForegroundColor White
    Write-Host "After installing, close and reopen PowerShell, then run 'gcloud init' to log in." -ForegroundColor Cyan
    exit 1
}

# 1. Set Google Cloud Project
Write-Host "`n[1/3] Setting Google Cloud active project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 2. Enable Required Google Cloud APIs
Write-Host "`n[2/3] Enabling Cloud Run, Cloud Build, and Artifact Registry APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 3. Deploy Unified Container to Cloud Run
Write-Host "`n[3/3] Building and deploying unified container to Cloud Run..." -ForegroundColor Yellow

# Load credentials from local backend/.env if present (never committed to git)
$backendEnvPath = Join-Path $PSScriptRoot "backend\.env"
$localSecrets = @{}
if (Test-Path $backendEnvPath) {
    Get-Content $backendEnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $localSecrets[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
        }
    }
}

function Get-SecretValue($key, $defaultVal = "") {
    if ($localSecrets.ContainsKey($key) -and $localSecrets[$key]) {
        return $localSecrets[$key]
    }
    $envVal = [Environment]::GetEnvironmentVariable($key)
    if ($envVal) {
        return $envVal
    }
    return $defaultVal
}

$twilioSid    = Get-SecretValue "TWILIO_ACCOUNT_SID" ""
$twilioToken  = Get-SecretValue "TWILIO_AUTH_TOKEN" ""
$twilioFrom   = Get-SecretValue "TWILIO_WHATSAPP_FROM" "whatsapp:+17372508034"
$geminiKey    = Get-SecretValue "GEMINI_API_KEY" ""
$smtpUser     = Get-SecretValue "SMTP_USER" "muhammadmataxu@gmail.com"
$smtpPass     = Get-SecretValue "SMTP_PASSWORD" ""
$smtpHost     = Get-SecretValue "SMTP_HOST" "smtp.gmail.com"
$smtpPort     = Get-SecretValue "SMTP_PORT" "587"
$smtpFromMail = Get-SecretValue "SMTP_FROM_EMAIL" "muhammadmataxu@gmail.com"
$smtpFromName = Get-SecretValue "SMTP_FROM_NAME" "UniSIRAJ CIA Helpdesk"
$smtpReplyTo  = Get-SecretValue "SMTP_REPLY_TO" "cia.helpdesk@unisiraj.edu.my"

$varsList = @(
    "ENVIRONMENT=production",
    "DEBUG=false",
    "DEFAULT_TIMEZONE=Asia/Kuala_Lumpur",
    "TWILIO_PROVIDER=mock",
    "SMTP_HOST=$smtpHost",
    "SMTP_PORT=$smtpPort",
    "SMTP_USER=$smtpUser",
    "SMTP_FROM_NAME=$smtpFromName",
    "SMTP_FROM_EMAIL=$smtpFromMail",
    "SMTP_REPLY_TO=$smtpReplyTo",
    "SMTP_USE_TLS=true",
    "SMTP_USE_SSL=false",
    "GEMINI_MODEL=gemini-3.5-flash-lite"
)

if ($twilioSid)   { $varsList += "TWILIO_ACCOUNT_SID=$twilioSid" }
if ($twilioToken) { $varsList += "TWILIO_AUTH_TOKEN=$twilioToken" }
if ($twilioFrom)  { $varsList += "TWILIO_WHATSAPP_FROM=$twilioFrom" }
if ($smtpPass)    { $varsList += "SMTP_PASSWORD=$smtpPass" }
if ($geminiKey)   { $varsList += "GEMINI_API_KEY=$geminiKey" }

$envVars = $varsList -join ","

gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 1Gi `
    --cpu 1 `
    --set-env-vars $envVars

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Deployment failed during gcloud run deploy (Exit Code: $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "Please review the build logs above for specific container issues." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)"
Write-Host "`nLive Application URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "Default Login: admin@unisiraj.edu.my / AdminSecurePassword123!`n" -ForegroundColor Yellow
