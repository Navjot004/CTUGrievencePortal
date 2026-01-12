// Quick update script for remaining dashboards
// Run this in PowerShell to add Grievance ID to all remaining dashboards

$files = @(
    "ExaminationAdminDashboard.jsx",
    "StudentWelfareAdminDashboard.jsx",
    "StudentSectionAdminDashboard.jsx",
    "AdminStaffDashboard.jsx"
)

$basePath = "c:\Users\NAVJOT SINGH\Desktop\GrievancePortal-collage\grievance-frontend\src\pages"

foreach ($file in $files) {
    $path = Join-Path $basePath $file
    $content = Get-Content $path -Raw
    
    # Add Grievance ID line after overflowY div
    $pattern = '(<div style=\{.*?overflowY.*?paddingRight.*?\}>)\s*(<p style=\{.*?\}><strong>(?:Student|Category))'
    $replacement = '$1`r`n                  <p style={{ marginBottom: ''10px'', color: ''#475569'' }}><strong>Grievance ID:</strong> {selectedGrievance._id}</p>`r`n                  $2'
    
    $newContent = $content -replace $pattern, $replacement
    
    if ($content -ne $newContent) {
        Set-Content -Path $path -Value $newContent -NoNewline
        Write-Host "✅ Updated $file"
    }
}
