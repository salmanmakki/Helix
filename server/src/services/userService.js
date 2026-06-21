const crypto = require('crypto');
const User = require('../models/User');
const CustomError = require('../utils/CustomError');
const { isDisposableEmail, sendVerificationOtp } = require('../utils/mail');

class UserService {
  /**
   * Generates a 6-digit OTP.
   */
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Registers a new user (unverified).
   */
  async register(name, email, password) {
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new CustomError('User already exists', 400);
    }

    if (isDisposableEmail(email)) {
      throw new CustomError('Disposable email addresses are not allowed. Please use a permanent email address.', 400);
    }

    const verificationOtp = this.generateOtp();
    const verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP email BEFORE creating the user — if it fails, no orphaned user
    const sendResult = await sendVerificationOtp(email, verificationOtp, name);
    if (!sendResult.sent) {
      throw new CustomError('Failed to send verification email. Please try again later.', 500);
    }

    const user = await User.create({
      name,
      email,
      password,
      verificationOtp,
      verificationOtpExpires,
      isVerified: false
    });

    return { user };
  }

  /**
   * Verifies a user's email with an OTP.
   */
  async verifyEmail(email, otp) {
    const user = await User.findOne({
      email,
      verificationOtp: otp,
      verificationOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new CustomError('Invalid or expired verification code', 400);
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    return user;
  }

  /**
   * Authenticates user & returns user doc if credentials match.
   */
  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new CustomError('Invalid email or password', 401);
    }
    if (user.isVerified === false) {
      throw new CustomError('Please verify your email address before logging in. Check your inbox or spam folder for the verification code.', 403);
    }
    return user;
  }

  /**
   * Gets user profile.
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    return user;
  }

  /**
   * Updates user profile details.
   */
  async updateProfile(userId, updateData) {
    const allowedUpdates = ['name', 'email', 'avatar', 'targetRole'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Cloudinary upload hooks can be placed here in the future
    if (updateData.avatarFile) {
      // Mock Cloudinary Integration:
      // const uploadResponse = await cloudinary.uploader.upload(updateData.avatarFile.path);
      // updates.avatar = uploadResponse.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    return user;
  }

  /**
   * Updates the refresh token in user document.
   */
  async updateRefreshToken(userId, token) {
    await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  /**
   * Clears the refresh token.
   */
  async clearRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  /**
   * Resends verification OTP.
   */
  async resendVerification(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError('No account found with this email address', 404);
    }
    if (user.isVerified) {
      throw new CustomError('This email is already verified. You can log in.', 400);
    }

    const verificationOtp = this.generateOtp();
    const verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationOtp = verificationOtp;
    user.verificationOtpExpires = verificationOtpExpires;
    await user.save();

    const sendResult = await sendVerificationOtp(email, verificationOtp, user.name);
    if (!sendResult.sent) {
      throw new CustomError('Failed to resend verification email. Please try again later.', 500);
    }

    return { user };
  }
}

module.exports = new UserService();
