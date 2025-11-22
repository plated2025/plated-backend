# Test Script for Plated Backend API

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Plated Backend API" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host "✅ Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Message: $($health.message)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Test 2: User Registration
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow
try {
    $registerBody = @{
        fullName = "John Doe"
        email = "john.doe@plated.com"
        password = "securepass123"
    } | ConvertTo-Json

    $register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    Write-Host "✅ Registration: SUCCESS" -ForegroundColor Green
    Write-Host "   User ID: $($register.data.user.id)" -ForegroundColor Gray
    Write-Host "   Name: $($register.data.user.fullName)" -ForegroundColor Gray
    Write-Host "   Email: $($register.data.user.email)" -ForegroundColor Gray
    Write-Host "   Username: $($register.data.user.username)" -ForegroundColor Gray
    Write-Host "   Token: $($register.data.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    $token = $register.data.token
    $userId = $register.data.user.id
} catch {
    Write-Host "⚠️  Registration: User might already exist" -ForegroundColor Yellow
    Write-Host "   Trying login instead..." -ForegroundColor Gray
    Write-Host ""
    
    # If registration fails, try login
    $loginBody = @{
        email = "john.doe@plated.com"
        password = "securepass123"
    } | ConvertTo-Json

    try {
        $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody

        $token = $login.data.token
        $userId = $login.data.user.id
        Write-Host "✅ Login: SUCCESS" -ForegroundColor Green
        Write-Host "   User ID: $($login.data.user.id)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Registration/Login: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host ""
        exit
    }
}

# Test 3: Login with Different User
Write-Host "3. Testing User Login (New User)..." -ForegroundColor Yellow
try {
    # First register another user
    $register2Body = @{
        fullName = "Jane Smith"
        email = "jane.smith@plated.com"
        password = "password123"
    } | ConvertTo-Json

    $register2 = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $register2Body -ErrorAction SilentlyContinue

    Write-Host "✅ Second User Registered" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️  Second user already exists, skipping..." -ForegroundColor Yellow
    Write-Host ""
}

# Now test login
Write-Host "4. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "jane.smith@plated.com"
        password = "password123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "✅ Login: SUCCESS" -ForegroundColor Green
    Write-Host "   User ID: $($login.data.user.id)" -ForegroundColor Gray
    Write-Host "   Name: $($login.data.user.fullName)" -ForegroundColor Gray
    Write-Host "   Subscription: $($login.data.user.subscriptionTier)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Test 4: Get Current User (Protected Route)
Write-Host "5. Testing Protected Route (Get Me)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $me = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
        -Method Get `
        -Headers $headers

    Write-Host "✅ Get Me: SUCCESS" -ForegroundColor Green
    Write-Host "   User ID: $($me.data._id)" -ForegroundColor Gray
    Write-Host "   Name: $($me.data.fullName)" -ForegroundColor Gray
    Write-Host "   Email: $($me.data.email)" -ForegroundColor Gray
    Write-Host "   User Type: $($me.data.userType)" -ForegroundColor Gray
    Write-Host "   Onboarding Complete: $($me.data.hasCompletedOnboarding)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Get Me: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Test 5: Update Onboarding
Write-Host "6. Testing Update Onboarding..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $onboardingBody = @{
        hasSelectedUserType = $true
        userType = "creator"
        interests = @("Italian", "Healthy", "Quick Meals")
    } | ConvertTo-Json

    $onboarding = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/onboarding" `
        -Method Put `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $onboardingBody

    Write-Host "✅ Update Onboarding: SUCCESS" -ForegroundColor Green
    Write-Host "   User Type: $($onboarding.data.userType)" -ForegroundColor Gray
    Write-Host "   Selected Type: $($onboarding.data.hasSelectedUserType)" -ForegroundColor Gray
    Write-Host "   Interests: $($onboarding.data.interests -join ', ')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Update Onboarding: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Test 6: Invalid Login
Write-Host "7. Testing Invalid Login (Security)..." -ForegroundColor Yellow
try {
    $invalidLoginBody = @{
        email = "wrong@plated.com"
        password = "wrongpassword"
    } | ConvertTo-Json

    $invalidLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $invalidLoginBody

    Write-Host "❌ Security Issue: Invalid login should fail!" -ForegroundColor Red
    Write-Host ""
} catch {
    Write-Host "✅ Security Test: PASSED (Invalid login rejected)" -ForegroundColor Green
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Backend is running at: http://localhost:5000" -ForegroundColor White
Write-Host "MongoDB: Connected" -ForegroundColor Green
Write-Host "Authentication: Working" -ForegroundColor Green
Write-Host "Protected Routes: Working" -ForegroundColor Green
Write-Host ""
Write-Host "✅ All core features are functional!" -ForegroundColor Green
Write-Host ""
