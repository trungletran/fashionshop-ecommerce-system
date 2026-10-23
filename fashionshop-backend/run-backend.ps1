$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$configPath = Join-Path $PSScriptRoot '.env.local'
if (Test-Path -LiteralPath $configPath) {
    Get-Content -LiteralPath $configPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}

if ([string]::IsNullOrWhiteSpace($env:CLOUDINARY_CLOUD_NAME) -or
    [string]::IsNullOrWhiteSpace($env:CLOUDINARY_API_KEY) -or
    [string]::IsNullOrWhiteSpace($env:CLOUDINARY_API_SECRET)) {
    Write-Warning 'Cloudinary credentials are incomplete. Set CLOUDINARY_API_SECRET in fashionshop-backend/.env.local before testing avatar upload.'
}

& .\mvnw.cmd clean spring-boot:run
exit $LASTEXITCODE
