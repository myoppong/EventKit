import { Router } from "express";
import { loginUser,registerUser,logoutUser } from "../controllers/user.js";
import { verifyJWT } from "../middlewares/verifyjwt.js";
//create user router
const userRouter = Router();




//define user routes
userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.post("/logout", verifyJWT, logoutUser);


export default userRouter;