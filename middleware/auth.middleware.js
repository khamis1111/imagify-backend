const jwt = require("jsonwebtoken");

const authToken = (req, res, next) => {
  try {
    // Check for the token header
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({
        status: "fail",
        msg: "Unauthorized, token is missing or malformed!",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      msg: "Unauthorized, invalid token!",
      error: error.message,
    });
  }
};

module.exports = authToken;
