
import express from 'express'
import { getUserData } from '../controller/userController.js'
import userAuthFun from '../middleware/userAuth.js'

const userRouter = express.Router()

userRouter.get('/data', userAuthFun,getUserData)

export default userRouter