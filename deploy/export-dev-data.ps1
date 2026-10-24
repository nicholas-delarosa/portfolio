# Exporta la base de datos de desarrollo de tu PC (lo que ya configuraste en el admin)
# para subirla al servidor y no tener que repetirlo.
# Uso (en PowerShell, desde la carpeta Portfolio): .\deploy\export-dev-data.ps1
# Nota: los mensajes van sin tildes porque PowerShell 5 los muestra mal
$ErrorActionPreference = 'Stop'

$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'
New-Item -ItemType Directory -Force $out | Out-Null
$file = Join-Path $out ("portfolio-dev-{0}.dump" -f (Get-Date -Format 'yyyyMMdd-HHmm'))

# pg_dump escribe binario: se copia desde el contenedor en vez de pasarlo por la consola
docker exec portfolio-dev-db-1 pg_dump -U portfolio -d portfolio -Fc -f /tmp/export.dump
docker cp portfolio-dev-db-1:/tmp/export.dump $file
docker exec portfolio-dev-db-1 rm /tmp/export.dump

Write-Host "* Exportado: $file"
Write-Host "* Subelo al servidor con:"
Write-Host "  scp `"$file`" ubuntu@IP-DEL-SERVIDOR:~/portfolio/backups/"
