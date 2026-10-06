@echo off
set "BUNDLED_NODE=C:\Users\V\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%BUNDLED_NODE%" (
  echo Bundled Node.js not found: %BUNDLED_NODE%
  exit /b 1
)

"%BUNDLED_NODE%" ".\node_modules\next\dist\bin\next" dev %*
