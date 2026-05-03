# Script para ejecutar el SQL en Supabase
# Configuración de credenciales
$supabaseUrl = "https://uxwfnirwulddouyzbnoc.supabase.co"
$supabaseKey = "sb_publishable_obpLlIulDX3D41urT0q33w_EBK83x9s"
$projectRef = "uxwfnirwulddouyzbnoc"

# Leer el archivo SQL
$sqlContent = Get-Content -Path "supabase_setup_fixed.sql" -Raw

# Dividir por puntos y coma para ejecutar múltiples queries
$queries = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" }

Write-Host "Conectando a Supabase..." -ForegroundColor Cyan
Write-Host "Proyecto: $projectRef" -ForegroundColor Green

$count = 0
foreach ($query in $queries) {
    $queryTrimmed = $query.Trim()
    if ($queryTrimmed.Length -gt 0) {
        $count++
        Write-Host "Ejecutando query $count..." -ForegroundColor Yellow
        
        # Crear el payload JSON
        $body = @{
            query = $queryTrimmed
        } | ConvertTo-Json
        
        # Hacer la petición
        try {
            $response = Invoke-RestMethod `
                -Uri "$supabaseUrl/rest/v1/rpc/sql" `
                -Method Post `
                -Headers @{
                    "apikey" = $supabaseKey
                    "Authorization" = "Bearer $supabaseKey"
                    "Content-Type" = "application/json"
                } `
                -Body $body
            
            Write-Host "✓ Query $count completada" -ForegroundColor Green
        } catch {
            Write-Host "✗ Error en query $count:" -ForegroundColor Red
            Write-Host $_.Exception.Message
        }
    }
}

Write-Host "`n✓ Setup completado!" -ForegroundColor Green
