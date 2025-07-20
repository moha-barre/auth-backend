import jwt from 'jsonwebtoken'

const userAuthFun = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      message: "account not authorised please login again",
    });
  }

  try {
    
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!tokenDecode.id) {
      return res.json({ success: false, message: 'not authorised login again' });
    }

    // Ensure req.body exists
    if (!req.body) req.body = {};
    req.body.userId = tokenDecode.id;
    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export default userAuthFun