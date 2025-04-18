import { Router } from "express";
import { loginUser,registerUser } from "../controllers/user.js";
//create user router
const userRouter = Router();




//define user routes
userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);

export default userRouter;