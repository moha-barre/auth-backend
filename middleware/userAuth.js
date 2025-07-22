import jwt from 'jsonwebtoken'

const userAuthFun = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Account not authorized, please login again",
    });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!tokenDecode.id) {
      return res.status(401).json({ success: false, message: 'Not authorized, login again' });
    }
    req.userId = tokenDecode.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default userAuthFun