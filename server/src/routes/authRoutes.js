const express = require('express');
const {
  registerUser,
  verifyEmail,
  loginUser,
  googleLogin,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator
} = require('../validators/authValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post('/register', registerValidator, validate, registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', loginValidator, validate, loginUser);
router.post('/google', googleLogin);
router.post('/refresh', refreshAccessToken);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfileValidator, validate, updateUserProfile);
router.post('/resend-verification', resendVerification);

module.exports = router;
