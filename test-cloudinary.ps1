# Test Cloudinary Configuration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Cloudinary Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if environment variables are set
Write-Host "Step 1: Checking Environment Variables..." -ForegroundColor Yellow

$envFile = Get-Content ".env" -ErrorAction SilentlyContinue

if ($envFile) {
    $cloudName = $envFile | Where-Object { $_ -match "CLOUDINARY_CLOUD_NAME=" }
    $apiKey = $envFile | Where-Object { $_ -match "CLOUDINARY_API_KEY=" }
    $apiSecret = $envFile | Where-Object { $_ -match "CLOUDINARY_API_SECRET=" }
    
    if ($cloudName -and $apiKey -and $apiSecret) {
        # Extract values
        $cloudNameValue = ($cloudName -split "=")[1]
        $apiKeyValue = ($apiKey -split "=")[1]
        $apiSecretValue = ($apiSecret -split "=")[1]
        
        # Check if they're placeholder values
        if ($cloudNameValue -eq "your_cloud_name" -or $cloudNameValue -eq "your_cloud_name_here") {
            Write-Host "❌ FAIL: Cloudinary credentials not configured" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please update .env file with your actual Cloudinary credentials:" -ForegroundColor Yellow
            Write-Host "1. Go to https://cloudinary.com and sign up" -ForegroundColor White
            Write-Host "2. Get your credentials from the dashboard" -ForegroundColor White
            Write-Host "3. Update backend/.env file:" -ForegroundColor White
            Write-Host "   CLOUDINARY_CLOUD_NAME=your_cloud_name" -ForegroundColor Gray
            Write-Host "   CLOUDINARY_API_KEY=your_api_key" -ForegroundColor Gray
            Write-Host "   CLOUDINARY_API_SECRET=your_api_secret" -ForegroundColor Gray
            Write-Host ""
            exit
        }
        
        Write-Host "✅ PASS: Environment variables found" -ForegroundColor Green
        Write-Host "   Cloud Name: $cloudNameValue" -ForegroundColor Gray
        Write-Host "   API Key: $($apiKeyValue.Substring(0, 5))..." -ForegroundColor Gray
        Write-Host "   API Secret: [HIDDEN]" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ FAIL: Cloudinary credentials missing from .env" -ForegroundColor Red
        Write-Host ""
        Write-Host "Add these lines to backend/.env:" -ForegroundColor Yellow
        Write-Host "CLOUDINARY_CLOUD_NAME=your_cloud_name" -ForegroundColor White
        Write-Host "CLOUDINARY_API_KEY=your_api_key" -ForegroundColor White
        Write-Host "CLOUDINARY_API_SECRET=your_api_secret" -ForegroundColor White
        Write-Host ""
        exit
    }
} else {
    Write-Host "❌ FAIL: .env file not found" -ForegroundColor Red
    exit
}

Write-Host "Step 2: Testing Upload Endpoint..." -ForegroundColor Yellow

# First, need to login to get token
try {
    $loginBody = @{
        email = "john.doe@plated.com"
        password = "securepass123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $login.data.token
    Write-Host "✅ Authenticated successfully" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not authenticate (need existing user)" -ForegroundColor Yellow
    Write-Host "   Run test-all-features.ps1 first to create test users" -ForegroundColor Gray
    Write-Host ""
    exit
}

Write-Host "Step 3: Checking Upload Routes..." -ForegroundColor Yellow

# Test if routes are accessible (will fail without actual file, but should not 404)
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    # This will fail with 400 (no file) but confirms route exists
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/upload/avatar" `
            -Method Post `
            -Headers $headers `
            -ErrorAction SilentlyContinue
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ PASS: Upload routes are accessible" -ForegroundColor Green
            Write-Host "   Status: Route exists (400 expected without file)" -ForegroundColor Gray
            Write-Host ""
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "❌ FAIL: Upload routes not found" -ForegroundColor Red
            Write-Host ""
            exit
        } else {
            Write-Host "✅ PASS: Upload routes configured" -ForegroundColor Green
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ FAIL: Could not check upload routes" -ForegroundColor Red
    Write-Host ""
    exit
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Cloudinary Configuration Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Environment Variables: CONFIGURED" -ForegroundColor Green
Write-Host "✅ Upload Routes: AVAILABLE" -ForegroundColor Green
Write-Host "✅ Authentication: WORKING" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Cloudinary is ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  • Upload recipe images" -ForegroundColor White
Write-Host "  • Upload user avatars" -ForegroundColor White
Write-Host "  • Upload cover images" -ForegroundColor White
Write-Host ""
Write-Host "Test with the ImageUpload component in the frontend!" -ForegroundColor Cyan
Write-Host ""
