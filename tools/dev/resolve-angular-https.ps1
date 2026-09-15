<#
.SYNOPSIS
Reports read-only Angular/Nx local HTTPS diagnostics.

.DESCRIPTION
The script resolves the active serve configuration, tests configured file
metadata without reading private-key content, inspects public certificate
metadata, and separates listener, routing, TLS, and trust findings. It does not
write files, start or stop processes, change DNS/hosts/trust state, or make an
insecure HTTP request.
#>
[CmdletBinding()]
param(
    [string]$Configuration = 'development'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-PropertyValue {
    param(
        [AllowNull()]
        [object]$Object,
        [Parameter(Mandatory)]
        [string]$Name
    )

    if ($null -eq $Object) {
        return $null
    }

    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Write-Section {
    param([Parameter(Mandatory)][string]$Title)

    Write-Output "`n$Title"
    Write-Output ('-' * $Title.Length)
}

function Resolve-ConfiguredPath {
    param(
        [AllowNull()]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$WorkspacePath
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $null
    }

    $expandedPath = [Environment]::ExpandEnvironmentVariables($Path)
    if (-not [System.IO.Path]::IsPathFullyQualified($expandedPath)) {
        $expandedPath = Join-Path $WorkspacePath $expandedPath
    }

    return [System.IO.Path]::GetFullPath($expandedPath)
}

function Get-FileAvailability {
    param([AllowNull()][string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return 'NOT CONFIGURED'
    }

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return 'NOT FOUND'
    }

    try {
        $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete)
        $stream.Dispose()
        return 'FOUND; READABLE'
    }
    catch {
        return 'FOUND; NOT READABLE'
    }
}

function Protect-SensitiveText {
    param([AllowNull()][string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $Text
    }

    $redactedText = $Text -replace '(?i)(--?(?:token|password|passwd|secret|api[-_]?key|access[-_]?token|authorization)\s*(?:=|:|\s+))("[^"]*"|\S+)', '$1<redacted>'
    return $redactedText -replace '(?i)((?:bearer|basic)\s+)\S+', '$1<redacted>'
}

function Get-OptionValue {
    param(
        [Parameter(Mandatory)][object]$ServeTarget,
        [AllowNull()][object]$TargetDefaults,
        [Parameter(Mandatory)][string]$ConfigurationName,
        [Parameter(Mandatory)][string]$Name
    )

    $targetConfiguration = Get-PropertyValue -Object (Get-PropertyValue -Object $ServeTarget -Name 'configurations') -Name $ConfigurationName
    $defaultConfiguration = Get-PropertyValue -Object (Get-PropertyValue -Object $TargetDefaults -Name 'configurations') -Name $ConfigurationName
    foreach ($source in @($targetConfiguration, (Get-PropertyValue -Object $ServeTarget -Name 'options'), $defaultConfiguration, (Get-PropertyValue -Object $TargetDefaults -Name 'options'))) {
        $value = Get-PropertyValue -Object $source -Name $Name
        if ($null -ne $value) {
            return $value
        }
    }

    return $null
}

function Get-LocalIpAddresses {
    $addresses = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($address in [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())) {
        if ($address.AddressFamily -in @([System.Net.Sockets.AddressFamily]::InterNetwork, [System.Net.Sockets.AddressFamily]::InterNetworkV6)) {
            [void]$addresses.Add($address.IPAddressToString)
        }
    }
    [void]$addresses.Add('127.0.0.1')
    [void]$addresses.Add('::1')
    return @($addresses | Sort-Object)
}

function Get-HostnameResolution {
    param(
        [Parameter(Mandatory)][string]$Hostname,
        [Parameter(Mandatory)][string[]]$LocalAddresses
    )

    try {
        $addresses = @([System.Net.Dns]::GetHostAddresses($Hostname) | ForEach-Object IPAddressToString | Sort-Object -Unique)
        $localMatch = @($addresses | Where-Object { $_ -in $LocalAddresses }).Count -gt 0
        return [pscustomobject]@{
            Hostname   = $Hostname
            Addresses  = if ($addresses.Count -gt 0) { $addresses -join ', ' } else { 'NONE' }
            LocalMatch = if ($localMatch) { 'YES' } else { 'NO' }
            Status     = if ($addresses.Count -gt 0) { 'RESOLVED' } else { 'UNRESOLVED' }
        }
    }
    catch {
        return [pscustomobject]@{
            Hostname   = $Hostname
            Addresses  = 'NONE'
            LocalMatch = 'NO'
            Status     = "UNRESOLVED ($($_.Exception.GetType().Name))"
        }
    }
}

function Get-SubjectAlternativeNames {
    param([Parameter(Mandatory)][System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate)

    $dnsNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $ipAddresses = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $sanExtension = $Certificate.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' } | Select-Object -First 1
    if ($null -eq $sanExtension) {
        return [pscustomobject]@{ DnsNames = @(); IpAddresses = @() }
    }

    $formattedSan = $sanExtension.Format($true)
    foreach ($match in [regex]::Matches($formattedSan, 'DNS Name=(?<value>[^,\r\n]+)')) {
        [void]$dnsNames.Add($match.Groups['value'].Value.Trim())
    }
    foreach ($match in [regex]::Matches($formattedSan, 'IP Address=(?<value>[^,\r\n]+)')) {
        [void]$ipAddresses.Add($match.Groups['value'].Value.Trim())
    }

    return [pscustomobject]@{ DnsNames = @($dnsNames | Sort-Object); IpAddresses = @($ipAddresses | Sort-Object) }
}

function Get-TrustResult {
    param([Parameter(Mandatory)][System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate)

    try {
        $chain = [System.Security.Cryptography.X509Certificates.X509Chain]::new()
        $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::NoCheck
        $chainIsTrusted = $chain.Build($Certificate)
        $statuses = @($chain.ChainStatus | ForEach-Object { $_.Status.ToString() } | Where-Object { $_ -ne 'NoError' } | Sort-Object -Unique)
        $statusText = if ($statuses.Count -eq 0) { 'NoError' } else { $statuses -join ', ' }
        return [pscustomobject]@{
            Result = if ($chainIsTrusted) { 'PASS' } else { 'FAIL' }
            Status = $statusText
            Root   = if ($chain.ChainElements.Count -gt 0) { $chain.ChainElements[$chain.ChainElements.Count - 1].Certificate.Subject } else { 'UNVERIFIED' }
            RootThumbprint = if ($chain.ChainElements.Count -gt 0) { $chain.ChainElements[$chain.ChainElements.Count - 1].Certificate.Thumbprint } else { $null }
        }
    }
    catch {
        return [pscustomobject]@{ Result = 'UNVERIFIED'; Status = $_.Exception.GetType().Name; Root = 'UNVERIFIED'; RootThumbprint = $null }
    }
}

function Get-RootStoreLocations {
    param([AllowNull()][string]$Thumbprint)

    if ([string]::IsNullOrWhiteSpace($Thumbprint)) {
        return 'UNVERIFIED'
    }

    $locations = [System.Collections.Generic.List[string]]::new()
    foreach ($location in @([System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser, [System.Security.Cryptography.X509Certificates.StoreLocation]::LocalMachine)) {
        try {
            $store = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root', $location)
            $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly)
            if (@($store.Certificates | Where-Object { $_.Thumbprint -eq $Thumbprint }).Count -gt 0) {
                $locations.Add("$location\Root")
            }
            $store.Close()
        }
        catch {
            $locations.Add("$location\Root (unavailable)")
        }
    }

    if ($locations.Count -gt 0) {
        return $locations -join ', '
    }

    return 'NOT FOUND'
}

$workspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$projectPath = Join-Path $workspacePath 'project.json'
$nxPath = Join-Path $workspacePath 'nx.json'
if (-not (Test-Path -LiteralPath $projectPath -PathType Leaf)) {
    throw "Angular project configuration was not found: $projectPath"
}

$project = Get-Content -LiteralPath $projectPath -Raw | ConvertFrom-Json
$nx = if (Test-Path -LiteralPath $nxPath -PathType Leaf) { Get-Content -LiteralPath $nxPath -Raw | ConvertFrom-Json } else { $null }
$serveTarget = Get-PropertyValue -Object (Get-PropertyValue -Object $project -Name 'targets') -Name 'serve'
if ($null -eq $serveTarget) {
    throw "No serve target was found in $projectPath"
}

$targetDefaults = Get-PropertyValue -Object (Get-PropertyValue -Object $nx -Name 'targetDefaults') -Name 'serve'
$ssl = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'ssl'
$configuredCertificatePath = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'sslCert'
$configuredKeyPath = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'sslKey'
$serveHost = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'host'
$port = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'port'
$buildTarget = Get-OptionValue -ServeTarget $serveTarget -TargetDefaults $targetDefaults -ConfigurationName $Configuration -Name 'buildTarget'
$certificatePath = Resolve-ConfiguredPath -Path $configuredCertificatePath -WorkspacePath $workspacePath
$keyPath = Resolve-ConfiguredPath -Path $configuredKeyPath -WorkspacePath $workspacePath

Write-Output 'Angular HTTPS diagnostic'
Write-Output '========================'
Write-Section -Title 'Active serve configuration'
[pscustomobject]@{
    Workspace      = $workspacePath
    Project         = Get-PropertyValue -Object $project -Name 'name'
    Target          = 'serve'
    Configuration   = $Configuration
    BuildTarget     = $buildTarget
    SSL             = if ($ssl -eq $true) { 'enabled' } else { 'disabled or unspecified' }
    Host            = if ([string]::IsNullOrWhiteSpace([string]$serveHost)) { 'UNSPECIFIED' } else { $serveHost }
    Port            = if ($null -eq $port) { 'UNSPECIFIED' } else { $port }
    Certificate     = if ($null -eq $certificatePath) { 'NOT CONFIGURED' } else { $certificatePath }
    CertificateFile = Get-FileAvailability -Path $certificatePath
    PrivateKey      = if ($null -eq $keyPath) { 'NOT CONFIGURED' } else { $keyPath }
    PrivateKeyFile  = Get-FileAvailability -Path $keyPath
} | Format-List

$certificate = $null
if ($ssl -eq $true -and $certificatePath -and (Test-Path -LiteralPath $certificatePath -PathType Leaf)) {
    try {
        $certificateCollection = [System.Security.Cryptography.X509Certificates.X509Certificate2Collection]::new()
        $certificateCollection.ImportFromPemFile($certificatePath)
        $certificate = @($certificateCollection | Where-Object { -not $_.Subject.Equals($_.Issuer, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1)[0]
        if ($null -eq $certificate) {
            $certificate = @($certificateCollection | Select-Object -First 1)[0]
        }
    }
    catch {
        Write-Section -Title 'Certificate result'
        Write-Output "TLS_CERTIFICATE_PARSE_ERROR: $($_.Exception.GetType().Name)"
    }
}

$san = [pscustomobject]@{ DnsNames = @(); IpAddresses = @() }
$certificateCommonName = $null
if ($null -ne $certificate) {
    $san = Get-SubjectAlternativeNames -Certificate $certificate
    $trust = Get-TrustResult -Certificate $certificate
    $rootStoreLocations = Get-RootStoreLocations -Thumbprint $trust.RootThumbprint
    $commonNameMatch = [regex]::Match($certificate.Subject, '(?:^|,\s*)CN=(?<value>[^,]+)')
    if ($commonNameMatch.Success) {
        $certificateCommonName = $commonNameMatch.Groups['value'].Value
    }
    Write-Section -Title 'Certificate result'
    [pscustomobject]@{
        Subject           = $certificate.Subject
        CommonName        = $certificateCommonName
        Issuer            = $certificate.Issuer
        NotBefore         = $certificate.NotBefore.ToUniversalTime().ToString('u')
        NotAfter          = $certificate.NotAfter.ToUniversalTime().ToString('u')
        ValidNow          = if ((Get-Date) -ge $certificate.NotBefore -and (Get-Date) -le $certificate.NotAfter) { 'PASS' } else { 'FAIL (TLS_EXPIRED_ERROR)' }
        Sha256Fingerprint = $certificate.GetCertHashString([System.Security.Cryptography.HashAlgorithmName]::SHA256)
        SanDns            = if ($san.DnsNames.Count -gt 0) { $san.DnsNames -join ', ' } else { 'NONE' }
        SanIp             = if ($san.IpAddresses.Count -gt 0) { $san.IpAddresses -join ', ' } else { 'NONE' }
        LocalTrust        = $trust.Result
        ChainStatus       = $trust.Status
        ChainRoot         = $trust.Root
        RootStore         = $rootStoreLocations
    } | Format-List
}

$localAddresses = Get-LocalIpAddresses
$candidateHosts = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($candidate in (@($certificateCommonName) + @($san.DnsNames) + @($serveHost) + @('localhost'))) {
    if (-not [string]::IsNullOrWhiteSpace([string]$candidate) -and -not $candidate.Contains('*')) {
        [void]$candidateHosts.Add([string]$candidate)
    }
}
$resolutions = @($candidateHosts | Sort-Object | ForEach-Object { Get-HostnameResolution -Hostname $_ -LocalAddresses $localAddresses })

Write-Section -Title 'Hostname and routing result'
Write-Output "Local addresses: $($localAddresses -join ', ')"
if ($resolutions.Count -gt 0) {
    $resolutions | Format-Table -AutoSize
}
else {
    Write-Output 'No DNS hostname candidate was available.'
}

$localhostInSan = $san.DnsNames -contains 'localhost'
Write-Output "localhost SAN: $(if ($localhostInSan) { 'YES' } else { 'NO (TLS_HOSTNAME_ERROR for https://localhost)' })"

$tlsCandidates = @($resolutions | Where-Object { $_.Hostname -in $san.DnsNames })
$localTlsCandidates = @($tlsCandidates | Where-Object { $_.LocalMatch -eq 'YES' })
$preferredTlsCandidate = @(@($tlsCandidates | Where-Object { $_.Hostname -eq $certificateCommonName }) + @($tlsCandidates | Where-Object { $_.Hostname -ne $certificateCommonName }) | Select-Object -First 1)[0]
if ($localTlsCandidates.Count -gt 0 -and $port) {
    Write-Output "Suggested local HTTPS URL: https://$($localTlsCandidates[0].Hostname):$port"
}
elseif ($null -ne $preferredTlsCandidate -and $port) {
    Write-Output "Certificate-valid URL candidate: https://$($preferredTlsCandidate.Hostname):$port"
    Write-Output 'ROUTING_ERROR: no certificate DNS hostname currently resolves to a local workstation address.'
}
else {
    Write-Output 'No certificate DNS hostname candidate was available for a suggested HTTPS URL.'
}

Write-Section -Title 'Port listener result'
if ($null -eq $port) {
    Write-Output 'SERVER_NOT_LISTENING: port is unspecified in the effective serve configuration.'
}
else {
    $connections = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$port) -ErrorAction SilentlyContinue)
    if ($connections.Count -eq 0) {
        Write-Output "SERVER_NOT_LISTENING: no listener was found on port $port."
    }
    else {
        Write-Output "SERVER_LISTENER: PASS (port $port is listening)."
        $processes = @(Get-CimInstance Win32_Process)
        $connections | ForEach-Object {
            $connection = $_
            $owner = $processes | Where-Object { $_.ProcessId -eq $connection.OwningProcess } | Select-Object -First 1
            [pscustomobject]@{
                LocalAddress = $connection.LocalAddress
                LocalPort    = $connection.LocalPort
                PID           = $connection.OwningProcess
                Process       = $owner.Name
                CommandLine   = Protect-SensitiveText -Text $owner.CommandLine
            }
        } | Format-Table -Wrap -AutoSize
    }
}

Write-Section -Title 'Browser transport result'
Write-Output 'BROWSER_TRANSPORT_UNVERIFIED: run a browser probe only after a verified local HTTPS request succeeds. Browser localhost may be isolated from this workstation.'
Write-Output 'No hosts, DNS, trust-store, process, private-key, or application configuration was modified.'
