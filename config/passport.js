const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google auth profile:', profile.id, profile.emails[0].value);
        
        // Check if user exists with Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          console.log('Existing Google user found:', user._id);
          return done(null, user);
        }
        
        // Check if email already exists (link accounts)
        if (profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            console.log('Linking Google to existing email account:', user._id);
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (!user.avatar && profile.photos && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            // Mark onboarding as complete for OAuth users
            if (!user.hasCompletedOnboarding) {
              user.hasCompletedOnboarding = true;
              user.hasSelectedUserType = true;
              user.userType = user.userType || 'regular';
            }
            await user.save();
            return done(null, user);
          }
        }
        
        // Create new user
        console.log('Creating new Google user');
        user = await User.create({
          fullName: profile.displayName || 'Google User',
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
          emailVerified: true, // Google emails are pre-verified
          hasCompletedOnboarding: true, // Skip onboarding for OAuth users
          hasSelectedUserType: true,
          userType: 'regular' // Default to regular user
        });
        
        console.log('New Google user created:', user._id);
        done(null, user);
      } catch (error) {
        console.error('Google auth error:', error);
        done(error, null);
      }
    }
  ));
  
  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️  Google OAuth not configured - missing credentials in .env');
}

// Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
  try {
    const keyPath = process.env.APPLE_PRIVATE_KEY_PATH || path.join(__dirname, 'AuthKey.p8');
    let privateKey;
    
    if (fs.existsSync(keyPath)) {
      privateKey = fs.readFileSync(keyPath, 'utf8');
      
      passport.use(new AppleStrategy({
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: privateKey,
          callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:5000/api/auth/apple/callback',
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, idToken, profile, done) => {
          try {
            console.log('Apple auth profile:', profile.sub);
            
            const appleId = profile.sub;
            
            // Check if user exists with Apple ID
            let user = await User.findOne({ appleId });
            
            if (user) {
              console.log('Existing Apple user found:', user._id);
              return done(null, user);
            }
            
            // Get email and name from Apple
            const email = profile.email;
            const name = req.body.user ? JSON.parse(req.body.user).name : null;
            
            // Check if email already exists (link accounts)
            if (email) {
              user = await User.findOne({ email });
              
              if (user) {
                console.log('Linking Apple to existing email account:', user._id);
                // Link Apple account
                user.appleId = appleId;
                user.authProvider = 'apple';
                // Mark onboarding as complete for OAuth users
                if (!user.hasCompletedOnboarding) {
                  user.hasCompletedOnboarding = true;
                  user.hasSelectedUserType = true;
                  user.userType = user.userType || 'regular';
                }
                await user.save();
                return done(null, user);
              }
            }
            
            // Create new user
            console.log('Creating new Apple user');
            const fullName = name 
              ? `${name.firstName || ''} ${name.lastName || ''}`.trim()
              : 'Apple User';
            
            user = await User.create({
              fullName,
              email: email || `${appleId}@privaterelay.appleid.com`,
              appleId,
              authProvider: 'apple',
              emailVerified: true, // Apple emails are pre-verified
              hasCompletedOnboarding: true, // Skip onboarding for OAuth users
              hasSelectedUserType: true,
              userType: 'regular' // Default to regular user
            });
            
            console.log('New Apple user created:', user._id);
            done(null, user);
          } catch (error) {
            console.error('Apple auth error:', error);
            done(error, null);
          }
        }
      ));
      
      console.log('✅ Apple OAuth strategy configured');
    } else {
      console.log('⚠️  Apple OAuth not configured - private key file not found at:', keyPath);
    }
  } catch (error) {
    console.error('❌ Error configuring Apple OAuth:', error.message);
  }
} else {
  console.log('⚠️  Apple OAuth not configured - missing credentials in .env');
}

module.exports = passport;
