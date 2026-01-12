#!/usr/bin/env pwsh
# Script to add Grievance ID to all dashboard modals

$dashboards = @(
    "StaffDashboard.jsx",
    "AdminDashboard.jsx",
    "SchoolAdminDashboard.jsx",
    "AccountAdminDashboard.jsx",
    "AdmissionAdminDashboard.jsx",
    "ExaminationAdminDashboard.jsx",
    "StudentWelfareAdminDashboard.jsx",
    "StudentSectionAdminDashboard.jsx",
    "AdminStaffDashboard.jsx"
)

$basePath = "c:\Users\NAVJOT SINGH\Desktop\GrievancePortal-collage\grievance-frontend\src\pages"

foreach ($dashboard in $dashboards) {
    $filePath = Join-Path $basePath $dashboard
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Pattern to find and replace
        $pattern = '(<div style=\{.*?overflowY.*?\}>)\s*(<p style=\{.*?\}><strong>Category:)'
        $replacement = '$1`r`n                <p style={{ marginBottom: ''10px'', color: ''#475569'' }}><strong>Grievance ID:</strong> {selectedGrievance._id}</p>`r`n                $2'
        
        $newContent = $content -replace $pattern, $replacement
        
        if ($content -ne $newContent) {
            Set-Content -Path $filePath -Value $newContent -NoNewline
            Write-Host "✅ Updated $dashboard"
        } else {
            Write-Host "⚠️  No changes needed for $dashboard"
        }
    } else {
        Write-Host "❌ File not found: $dashboard"
    }
}

Write-Host "`n✨ All dashboards updated!"
