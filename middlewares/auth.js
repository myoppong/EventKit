// middlewares/auth.js
import { expressjwt } from "express-jwt";

export const isAuthenticated = expressjwt({
  secret: process.env.JWT_SECRET_KEY,
  algorithms: ['HS256'],
  requestProperty: "auth",
});

export const authorizedRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Please log in" });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Access denied: No permission" });
    }

    next();
  };
};
