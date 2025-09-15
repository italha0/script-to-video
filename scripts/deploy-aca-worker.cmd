@echo off
setlocal enableextensions enabledelayedexpansion

rem Ensure Azure CLI + Container Apps extension are installed
az extension show --name containerapp >NUL 2>&1 || az extension add --name containerapp

rem ================== CONFIGURE THESE VALUES ==================
set "SUBSCRIPTION_ID="
set "LOCATION=eastus"
set "RG=stvw-worker-rg"
set "ENV_NAME=stvw-env"
set "APP_NAME=stvw-worker"

rem Use a pushed image (Docker Hub or ACR). Example: dockerhubuser/script-to-video-worker:latest
set "IMAGE=docker.io/youruser/script-to-video-worker:latest"

rem Optional: private registry settings (leave blank for public images)
set "REGISTRY_SERVER="
set "REGISTRY_USERNAME="
set "REGISTRY_PASSWORD="

rem App env (copy from your .env; do NOT commit real secrets)
set "NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co"
set "SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME"
set "AZURE_STORAGE_CONNECTION_STRING=REPLACE_ME"
set "AZURE_STORAGE_ACCOUNT_NAME=REPLACE_ME"
set "AZURE_STORAGE_ACCOUNT_KEY=REPLACE_ME"
set "RENDER_QUEUE_ENABLED=false"
set "REDIS_URL="

rem Scale + resources
set "MIN_REPLICAS=1"
set "MAX_REPLICAS=1"
set "CPU=1.0"
set "MEMORY=2.0Gi"
rem ================== END CONFIG ==================

if not "%SUBSCRIPTION_ID%"=="" (
  echo Setting subscription %SUBSCRIPTION_ID%
  az account set --subscription "%SUBSCRIPTION_ID%"
)

echo Creating resource group %RG% in %LOCATION%
az group create --name "%RG" --location "%LOCATION%" 1> NUL

set "LAW_NAME=%APP_NAME%-logs"
echo Creating Log Analytics workspace %LAW_NAME%
az monitor log-analytics workspace create --resource-group "%RG%" --workspace-name "%LAW_NAME%" --location "%LOCATION%" 1> NUL
for /f "usebackq delims=" %%i in (`az monitor log-analytics workspace show --resource-group "%RG%" --workspace-name "%LAW_NAME%" --query customerId -o tsv`) do set LOG_ID=%%i
for /f "usebackq delims=" %%i in (`az monitor log-analytics workspace get-shared-keys --resource-group "%RG%" --workspace-name "%LAW_NAME%" --query primarySharedKey -o tsv`) do set LOG_KEY=%%i

echo Creating Container Apps environment %ENV_NAME%
az containerapp env create --name "%ENV_NAME%" --resource-group "%RG%" --location "%LOCATION%" --logs-workspace-id "%LOG_ID%" --logs-workspace-key "%LOG_KEY%" 1> NUL

set "REGISTRY_ARGS="
if not "%REGISTRY_SERVER%"=="" (
  set "REGISTRY_ARGS=--registry-server %REGISTRY_SERVER% --registry-username %REGISTRY_USERNAME% --registry-password %REGISTRY_PASSWORD%"
)

echo Creating Container App %APP_NAME% from image %IMAGE%
az containerapp create ^
  --name "%APP_NAME%" ^
  --resource-group "%RG%" ^
  --environment "%ENV_NAME%" ^
  --image "%IMAGE%" ^
  --min-replicas %MIN_REPLICAS% ^
  --max-replicas %MAX_REPLICAS% ^
  --cpu %CPU% ^
  --memory %MEMORY% ^
  %REGISTRY_ARGS% ^
  --secrets ^
    supabaseServiceRoleKey="%SUPABASE_SERVICE_ROLE_KEY%" ^
    azureStorageConnectionString="%AZURE_STORAGE_CONNECTION_STRING%" ^
    azureStorageAccountKey="%AZURE_STORAGE_ACCOUNT_KEY%" ^
  --env-vars ^
    NEXT_PUBLIC_SUPABASE_URL="%NEXT_PUBLIC_SUPABASE_URL%" ^
    SUPABASE_SERVICE_ROLE_KEY=secretref:supabaseServiceRoleKey ^
    AZURE_STORAGE_CONNECTION_STRING=secretref:azureStorageConnectionString ^
    AZURE_STORAGE_ACCOUNT_NAME="%AZURE_STORAGE_ACCOUNT_NAME%" ^
    AZURE_STORAGE_ACCOUNT_KEY=secretref:azureStorageAccountKey ^
    RENDER_QUEUE_ENABLED="%RENDER_QUEUE_ENABLED%" ^
    REDIS_URL="%REDIS_URL%"

echo Deployment complete. Tailing logs...
az containerapp logs show --name "%APP_NAME%" --resource-group "%RG%" --follow

endlocal
