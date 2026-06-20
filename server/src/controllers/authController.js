const { OAuth2Client } = require('google-auth-library');
const userService = require('../services/userService');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user (unverified)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await userService.register(name, email, password);

  const responseData = {
    _id: result.user._id,
    name: result.user.name,
    email: result.user.email
  };

  return apiResponse.success(res, responseData, 'Registration successful. Please check your email to verify your account.', 201);
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return apiResponse.error(res, 'Email and verification code are required', 400);
  }
  const user = await userService.verifyEmail(email, otp);
  return apiResponse.success(res, {
    _id: user._id,
    name: user.name,
    email: user.email,
    isVerified: true
  }, 'Email verified successfully. You can now log in.');
});

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.login(email, password);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await userService.updateRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return apiResponse.success(res, {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    targetRole: user.targetRole,
    token: accessToken
  }, 'Login successful');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return apiResponse.error(res, 'Refresh token not provided', 401);
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'helix_refresh_token_secret_2026_aBc'
    );

    const user = await userService.getProfile(decoded.id);

    if (user.refreshToken !== refreshToken) {
      return apiResponse.error(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user._id);
    return apiResponse.success(res, { token: accessToken }, 'Token refreshed');
  } catch (error) {
    return apiResponse.error(res, 'Session expired, please log in again', 401);
  }
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  await userService.clearRefreshToken(req.user._id);
  res.clearCookie('refreshToken');
  return apiResponse.success(res, null, 'Successfully logged out');
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  return apiResponse.success(res, user, 'Profile retrieved');
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return apiResponse.success(res, user, 'Profile updated successfully');
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return apiResponse.error(res, 'Email is required', 400);
  }

  await userService.resendVerification(email);

  return apiResponse.success(res, null, 'Verification code sent. Please check your inbox.');
});

// @desc    Login with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, avatar, googleId } = req.body;
  if (!email || !googleId) {
    return apiResponse.error(res, 'Email and Google ID are required', 400);
  }
  const picture = avatar || '';

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }
    if (!user.avatar && picture) {
      user.avatar = picture;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationOtp = undefined;
      user.verificationOtpExpires = undefined;
    }
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture || '',
      isVerified: true
    });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  await userService.updateRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return apiResponse.success(res, {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    targetRole: user.targetRole,
    token: accessToken
  }, 'Google login successful');
});

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  googleLogin,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  resendVerification
};
