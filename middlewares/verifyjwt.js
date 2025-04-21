// middlewares/verifyJWT.js
import jwt from "jsonwebtoken";

export const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.auth = decoded; // makes user data available in req
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
