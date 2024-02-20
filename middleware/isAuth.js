const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // to first check if we have an 'Authorization' header in the first place
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }

  // to extract token from incoming req. (Need to implement way 2 attach )
  const token = authHeader.split(" ")[1]; // To exclude the 'Bearer to.'

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, "thisIsTheSecretKey");
  } catch (err) {
    // Error handle if token CANT be decoded properly (Not validated)
    err.statusCode = 500;
    throw err;
  }
  //Error handling if decoding worked BUT 'undefined'
  if (!decodedToken) {
    const error = new Error("Not Authenticated.");
    error.statusCode = 401;
    throw error;
  }
  // Final: token is both decoded and validated! To now extract it!
  req.userId = decodedToken.userId;
  next();
};
