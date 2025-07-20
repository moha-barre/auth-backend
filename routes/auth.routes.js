import express from 'express'
import { isAuthanticated, login, logOut, register, resetingPass, resetOtp, sendVerifyOTP, verifyEmailOtp } from '../controller/authController.js'
import userAuthFun from '../middleware/userAuth.js'

const authRouter = express.Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout', logOut)
authRouter.post('/send-verify-otp', userAuthFun, sendVerifyOTP)
authRouter.post('/verify-account', userAuthFun, verifyEmailOtp)
authRouter.post('/is-auth', isAuthanticated)
authRouter.post('/send-reset-otp',resetOtp)
authRouter.post('/reset-password',  resetingPass)

export default authRouter