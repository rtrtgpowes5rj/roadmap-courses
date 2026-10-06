$BundledNode = "C:\Users\V\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (!(Test-Path $BundledNode)) {
  Write-Error "Bundled Node.js not found at $BundledNode"
  exit 1
}

& $BundledNode ".\node_modules\next\dist\bin\next" "dev" @args
