[CmdletBinding()]
param(
	[ValidateSet("inventory", "delete")]
	[string]$Action = "inventory",

	[string[]]$Regions = @("us-east-2"),

	[bool]$OnlyNonTerraform = $true,

	[Alias("DeleteVirginiaOnly")]
	[switch]$DeleteOhioOnly,

	[switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-AwsCli {
	if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
		throw "AWS CLI no esta instalado o no esta en PATH."
	}
}

function Get-TagValue {
	param(
		[Parameter(Mandatory = $true)]
		$TagList,
		[Parameter(Mandatory = $true)]
		[string]$Key
	)

	foreach ($tag in $TagList) {
		if ($tag.Key -ieq $Key) {
			return $tag.Value
		}
	}

	return $null
}

function Get-TaggedResourcesByRegion {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Region
	)

	$all = @()
	$paginationToken = $null

	do {
		$args = @("resourcegroupstaggingapi", "get-resources", "--region", $Region, "--output", "json")

		if ($paginationToken) {
			$args += @("--pagination-token", $paginationToken)
		}

		$responseJson = aws @args
		if ($LASTEXITCODE -ne 0) {
			throw "Error consultando recursos en $Region."
		}

		$response = $responseJson | ConvertFrom-Json
		if ($response.ResourceTagMappingList) {
			$all += $response.ResourceTagMappingList
		}

		$paginationToken = $null
		if ($response.PSObject.Properties.Name -contains "PaginationToken") {
			$paginationToken = $response.PaginationToken
		}
	} while ($paginationToken)

	return $all
}

function New-InventoryItem {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Region,
		[Parameter(Mandatory = $true)]
		$Mapping
	)

	$arn = [string]$Mapping.ResourceARN
	$arnParts = $arn.Split(":")
	$service = if ($arnParts.Length -ge 3) { $arnParts[2] } else { "unknown" }
	$resourcePart = if ($arnParts.Length -ge 6) { $arnParts[5] } else { "" }
	$resourceType = if ($resourcePart.Contains("/")) { $resourcePart.Split("/")[0] } elseif ($resourcePart.Contains(":")) { $resourcePart.Split(":")[0] } else { $resourcePart }

	$managedBy = Get-TagValue -TagList $Mapping.Tags -Key "ManagedBy"
	$name = Get-TagValue -TagList $Mapping.Tags -Key "Name"

	[PSCustomObject]@{
		Region       = $Region
		Arn          = $arn
		Service      = $service
		ResourceType = $resourceType
		Name         = if ($name) { $name } else { "" }
		ManagedBy    = if ($managedBy) { $managedBy } else { "" }
	}
}

function Parse-EcsServiceArn {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:ecs:region:account:service/cluster-name/service-name
	if ($Arn -match "^arn:aws:ecs:[^:]+:[^:]+:service/([^/]+)/([^/]+)$") {
		return @{ Cluster = $matches[1]; Service = $matches[2] }
	}

	return $null
}

function Parse-EcsClusterArn {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:ecs:region:account:cluster/cluster-name
	if ($Arn -match "^arn:aws:ecs:[^:]+:[^:]+:cluster/([^/]+)$") {
		return $matches[1]
	}

	return $null
}

function Parse-RdsDbArn {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:rds:region:account:db:db-identifier
	if ($Arn -match "^arn:aws:rds:[^:]+:[^:]+:db:([^:]+)$") {
		return $matches[1]
	}

	return $null
}

function Parse-ElastiCacheClusterArn {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:elasticache:region:account:cluster:cluster-name
	if ($Arn -match "^arn:aws:elasticache:[^:]+:[^:]+:cluster:([^:]+)$") {
		return $matches[1]
	}

	return $null
}

function Parse-MqBrokerId {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:mq:region:account:broker:broker-id
	if ($Arn -match "^arn:aws:mq:[^:]+:[^:]+:broker:([^:]+)$") {
		return $matches[1]
	}

	return $null
}

function Parse-EcrRepositoryName {
	param([Parameter(Mandatory = $true)][string]$Arn)
	# arn:aws:ecr:region:account:repository/repo-name
	if ($Arn -match "^arn:aws:ecr:[^:]+:[^:]+:repository/(.+)$") {
		return $matches[1]
	}

	return $null
}

function Remove-InventoryItem {
	param(
		[Parameter(Mandatory = $true)]
		$Item
	)

	$region = $Item.Region
	$arn = $Item.Arn
	$service = $Item.Service
	$resourceType = $Item.ResourceType

	try {
		switch ("$service::$resourceType") {
			"ecs::service" {
				$parsed = Parse-EcsServiceArn -Arn $arn
				if (-not $parsed) { throw "No se pudo parsear ARN ECS service: $arn" }
				aws ecs update-service --region $region --cluster $parsed.Cluster --service $parsed.Service --desired-count 0 | Out-Null
				aws ecs delete-service --region $region --cluster $parsed.Cluster --service $parsed.Service --force | Out-Null
				return "deleted"
			}
			"ecs::cluster" {
				$cluster = Parse-EcsClusterArn -Arn $arn
				if (-not $cluster) { throw "No se pudo parsear ARN ECS cluster: $arn" }
				aws ecs delete-cluster --region $region --cluster $cluster | Out-Null
				return "deleted"
			}
			"elasticloadbalancing::loadbalancer" {
				aws elbv2 delete-load-balancer --region $region --load-balancer-arn $arn | Out-Null
				return "deleted"
			}
			"elasticloadbalancing::targetgroup" {
				aws elbv2 delete-target-group --region $region --target-group-arn $arn | Out-Null
				return "deleted"
			}
			"ecr::repository" {
				$repo = Parse-EcrRepositoryName -Arn $arn
				if (-not $repo) { throw "No se pudo parsear ARN ECR repository: $arn" }
				aws ecr delete-repository --region $region --repository-name $repo --force | Out-Null
				return "deleted"
			}
			"rds::db" {
				$dbId = Parse-RdsDbArn -Arn $arn
				if (-not $dbId) { throw "No se pudo parsear ARN RDS DB: $arn" }
				aws rds delete-db-instance --region $region --db-instance-identifier $dbId --skip-final-snapshot --delete-automated-backups | Out-Null
				return "delete-requested"
			}
			"elasticache::cluster" {
				$clusterId = Parse-ElastiCacheClusterArn -Arn $arn
				if (-not $clusterId) { throw "No se pudo parsear ARN ElastiCache cluster: $arn" }
				aws elasticache delete-cache-cluster --region $region --cache-cluster-id $clusterId | Out-Null
				return "delete-requested"
			}
			"mq::broker" {
				$brokerId = Parse-MqBrokerId -Arn $arn
				if (-not $brokerId) { throw "No se pudo parsear ARN MQ broker: $arn" }
				aws mq delete-broker --region $region --broker-id $brokerId | Out-Null
				return "delete-requested"
			}
			default {
				return "unsupported"
			}
		}
	}
	catch {
		Write-Warning "Fallo eliminando $arn : $($_.Exception.Message)"
		return "error"
	}
}

Assert-AwsCli

Write-Host "Accion: $Action"
Write-Host "Regiones: $($Regions -join ', ')"
Write-Host "Solo no Terraform: $OnlyNonTerraform"

$inventory = @()
foreach ($region in $Regions) {
	Write-Host "Consultando recursos etiquetados en $region..."
	$mappings = Get-TaggedResourcesByRegion -Region $region
	foreach ($m in $mappings) {
		$inventory += New-InventoryItem -Region $region -Mapping $m
	}
}

if ($OnlyNonTerraform) {
	$inventory = $inventory | Where-Object { $_.ManagedBy -ine "terraform" }
}

$inventory = @($inventory)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = Join-Path -Path $PSScriptRoot -ChildPath "reports"
if (-not (Test-Path $reportDir)) {
	New-Item -ItemType Directory -Path $reportDir | Out-Null
}
$reportPath = Join-Path -Path $reportDir -ChildPath "aws-resource-inventory-$timestamp.csv"
$inventory | Sort-Object Region, Service, ResourceType, Name | Export-Csv -Path $reportPath -NoTypeInformation -Encoding UTF8

Write-Host "\nInventario generado: $reportPath"
Write-Host "Total recursos encontrados: $($inventory.Count)"
$inventory | Sort-Object Region, Service, ResourceType, Name | Format-Table Region, Service, ResourceType, Name, ManagedBy, Arn -AutoSize

if ($Action -eq "delete") {
	$targetRegions = if ($DeleteOhioOnly) { @("us-east-2") } else { $Regions }
		$toDelete = @($inventory | Where-Object { $targetRegions -contains $_.Region })

	Write-Host "\nRecursos candidatos a borrar: $($toDelete.Count)"
	Write-Host "Regiones objetivo de borrado: $($targetRegions -join ', ')"

	if (-not $Force) {
		$confirmation = Read-Host "Escribe DELETE para confirmar"
		if ($confirmation -cne "DELETE") {
			Write-Host "Operacion cancelada."
			exit 0
		}
	}

	$results = @()
	foreach ($item in $toDelete) {
		$status = Remove-InventoryItem -Item $item
		$results += [PSCustomObject]@{
			Region = $item.Region
			Arn    = $item.Arn
			Status = $status
		}
	}

	$deleteReportPath = Join-Path -Path $reportDir -ChildPath "aws-delete-results-$timestamp.csv"
	$results | Export-Csv -Path $deleteReportPath -NoTypeInformation -Encoding UTF8

	Write-Host "\nResultado de borrado guardado en: $deleteReportPath"
	$results | Group-Object Status | Sort-Object Name | Format-Table Name, Count -AutoSize
	Write-Host "Nota: 'unsupported' significa que el tipo de recurso requiere borrado manual o logica adicional."
}
