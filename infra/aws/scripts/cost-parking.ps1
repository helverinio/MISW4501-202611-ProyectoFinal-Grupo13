[CmdletBinding()]
param(
    [ValidateSet("status", "down", "up")]
    [string]$Action = "status",

    [string]$Region = "us-east-2",

    [string]$ClusterName = "th-prod-ecs",

    [string]$DbInstanceIdentifier = "th-prod-postgres",

    [switch]$SkipEcs,

    [switch]$SkipRds,

    [switch]$WaitForDb,

    [int]$DbWaitTimeoutMinutes = 25
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$serviceConfigs = [ordered]@{
    "th-prod-gateway" = @{ Desired = 2; Max = 4 }
    "th-prod-reservas" = @{ Desired = 1; Max = 2 }
    "th-prod-pagos" = @{ Desired = 1; Max = 2 }
    "th-prod-ext-payments" = @{ Desired = 1; Max = 2 }
    "th-prod-usuarios" = @{ Desired = 1; Max = 2 }
}

function Assert-AwsCli {
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        throw "AWS CLI no esta instalado o no esta en PATH."
    }
}

function Invoke-AwsJson {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $script:ErrorActionPreference = "Continue"
    try {
        $output = aws @Args 2>&1 | Out-String
    }
    finally {
        $script:ErrorActionPreference = $previousErrorActionPreference
    }

    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI fallo: aws $($Args -join ' ')`n$output"
    }

    if (-not $output) {
        return $null
    }

    return $output | ConvertFrom-Json
}

function Invoke-Aws {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $script:ErrorActionPreference = "Continue"
    try {
        $output = aws @Args 2>&1 | Out-String
    }
    finally {
        $script:ErrorActionPreference = $previousErrorActionPreference
    }

    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI fallo: aws $($Args -join ' ')`n$output"
    }

    return $output
}

function Set-EcsScalingWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ServiceName,

        [Parameter(Mandatory = $true)]
        [int]$MinCapacity,

        [Parameter(Mandatory = $true)]
        [int]$MaxCapacity
    )

    $resourceId = "service/$ClusterName/$ServiceName"
    Invoke-Aws -Args @(
        "application-autoscaling", "register-scalable-target",
        "--region", $Region,
        "--service-namespace", "ecs",
        "--resource-id", $resourceId,
        "--scalable-dimension", "ecs:service:DesiredCount",
        "--min-capacity", "$MinCapacity",
        "--max-capacity", "$MaxCapacity"
    ) | Out-Null
}

function Set-EcsDesiredCount {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ServiceName,

        [Parameter(Mandatory = $true)]
        [int]$DesiredCount
    )

    Invoke-Aws -Args @(
        "ecs", "update-service",
        "--region", $Region,
        "--cluster", $ClusterName,
        "--service", $ServiceName,
        "--desired-count", "$DesiredCount"
    ) | Out-Null
}

function Get-EcsServicesStatus {
    $serviceNames = @($serviceConfigs.Keys)
    if ($serviceNames.Count -eq 0) {
        return @()
    }

    $args = @(
        "ecs", "describe-services",
        "--region", $Region,
        "--cluster", $ClusterName,
        "--services"
    ) + $serviceNames

    $response = Invoke-AwsJson -Args $args

    $statuses = @()
    foreach ($service in $response.services) {
        $statuses += [PSCustomObject]@{
            ServiceName   = $service.serviceName
            DesiredCount  = $service.desiredCount
            RunningCount  = $service.runningCount
            PendingCount  = $service.pendingCount
            LaunchType    = $service.launchType
            Status        = $service.status
        }
    }

    return $statuses | Sort-Object ServiceName
}

function Get-RdsStatus {
    $response = Invoke-AwsJson -Args @(
        "rds", "describe-db-instances",
        "--region", $Region,
        "--db-instance-identifier", $DbInstanceIdentifier
    )

    $instance = $response.DBInstances[0]
    return [PSCustomObject]@{
        Identifier = $instance.DBInstanceIdentifier
        Status     = $instance.DBInstanceStatus
        Engine     = $instance.Engine
        Class      = $instance.DBInstanceClass
        Endpoint   = if ($instance.Endpoint) { $instance.Endpoint.Address } else { "" }
    }
}

function Wait-ForRdsStatus {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExpectedStatus
    )

    $deadline = (Get-Date).AddMinutes($DbWaitTimeoutMinutes)
    while ((Get-Date) -lt $deadline) {
        $status = Get-RdsStatus
        Write-Host "RDS $($status.Identifier): $($status.Status)"
        if ($status.Status -eq $ExpectedStatus) {
            return
        }

        Start-Sleep -Seconds 20
    }

    throw "Timeout esperando que RDS quede en estado '$ExpectedStatus'."
}

function Stop-RdsIfNeeded {
    $status = Get-RdsStatus
    switch ($status.Status) {
        "available" {
            Write-Host "Deteniendo RDS $($status.Identifier)..."
            Invoke-Aws -Args @(
                "rds", "stop-db-instance",
                "--region", $Region,
                "--db-instance-identifier", $DbInstanceIdentifier
            ) | Out-Null
        }
        "stopping" {
            Write-Host "RDS $($status.Identifier) ya esta deteniendose."
        }
        "stopped" {
            Write-Host "RDS $($status.Identifier) ya esta detenido."
        }
        default {
            Write-Warning "RDS $($status.Identifier) esta en estado '$($status.Status)'. No se envio stop."
        }
    }
}

function Start-RdsIfNeeded {
    $status = Get-RdsStatus
    switch ($status.Status) {
        "stopped" {
            Write-Host "Iniciando RDS $($status.Identifier)..."
            Invoke-Aws -Args @(
                "rds", "start-db-instance",
                "--region", $Region,
                "--db-instance-identifier", $DbInstanceIdentifier
            ) | Out-Null
        }
        "starting" {
            Write-Host "RDS $($status.Identifier) ya esta iniciando."
        }
        "available" {
            Write-Host "RDS $($status.Identifier) ya esta disponible."
        }
        default {
            Write-Warning "RDS $($status.Identifier) esta en estado '$($status.Status)'. No se envio start."
        }
    }
}

function Set-DownMode {
    foreach ($item in $serviceConfigs.GetEnumerator()) {
        Write-Host "Parqueando ECS service $($item.Key)..."
        Set-EcsScalingWindow -ServiceName $item.Key -MinCapacity 0 -MaxCapacity 0
        Set-EcsDesiredCount -ServiceName $item.Key -DesiredCount 0
    }

    Write-Host "Servicios ECS parqueados."
}

function Set-UpMode {
    foreach ($item in $serviceConfigs.GetEnumerator()) {
        Write-Host "Restaurando auto scaling para $($item.Key)..."
        Set-EcsScalingWindow -ServiceName $item.Key -MinCapacity $item.Value.Desired -MaxCapacity $item.Value.Max
        Set-EcsDesiredCount -ServiceName $item.Key -DesiredCount $item.Value.Desired
    }

    Write-Host "Servicios ECS restaurados."
}

function Show-Status {
    Write-Host "Region: $Region"
    Write-Host "Cluster ECS: $ClusterName"
    Write-Host "RDS: $DbInstanceIdentifier"
    Write-Host ""

    if (-not $SkipEcs) {
        Write-Host "Estado ECS:"
        Get-EcsServicesStatus | Format-Table -AutoSize | Out-String | Write-Host
    }

    if (-not $SkipRds) {
        Write-Host "Estado RDS:"
        $rdsStatus = Get-RdsStatus
        $rdsStatus | Format-Table -AutoSize | Out-String | Write-Host
    }

    Write-Host "Notas: Redis, Amazon MQ, ALB y CloudFront siguen generando costo fijo con este script."
}

Assert-AwsCli

switch ($Action) {
    "status" {
        Show-Status
    }
    "down" {
        if (-not $SkipEcs) {
            Set-DownMode
        }

        if (-not $SkipRds) {
            Stop-RdsIfNeeded
        }

        Show-Status
    }
    "up" {
        if (-not $SkipRds) {
            Start-RdsIfNeeded
            if ($WaitForDb) {
                Wait-ForRdsStatus -ExpectedStatus "available"
            }
        }

        if (-not $SkipEcs) {
            Set-UpMode
        }

        Show-Status
    }
}