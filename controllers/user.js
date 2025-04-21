import bcrypt from 'bcrypt';
import { userModel } from '../models/user.js';
import { userRegisterSchema, loginValidator} from '../validators/user.js';
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
  try {

    // Validate input
    const { error, value } = userRegisterSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((err) => err.message);
      return res.status(400).json({ errors: messages });
    }

    const { username, email, phone, password, role } = value;

    // Check if email or username or phone already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email, username, or phone already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await userModel.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};


export const loginUser = async (req, res, next) => {
    // Validate user input
    const { error, value } = loginValidator.validate(req.body);
    if (error) {
        return res.status(422).json({ error: error.details[0].message });
    }

    try {
        // Check database for user existence using either username, email, or phone number
        const user = await userModel.findOne({
            $or: [
                { username: value.username },
                { email: value.email },
                { phone: value.phone }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User does not exist' });
        }

        // Compare password with stored hashed password
        const correctPassword = bcrypt.compareSync(value.password, user.password);
        if (!correctPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Check the role (optional if role verification is required for login)
        // if (user.role !== value.role) {
        //     return res.status(403).json({ message: 'Unauthorized role selected' });
        // }

        // Generate access token
        const accessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role }, 
          process.env.JWT_SECRET_KEY,
          { expiresIn: '24h' }
        );
        

        // Return the response with token and user data
        res.status(200).json({
            accessToken,
            user: {
                role: user.role,
                email: user.email,
                username: user.username,
                phone: user.phone
            }
        });
    } catch (error) {
        next(error);
    }
};


// controllers/authController.js

export const logoutUser = async (req, res) => {
  try {
    // Optionally, you can perform token blacklisting here if needed
    res.status(200).json({
      message: "Logged out successfully. Please discard the token on the client side.",
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ message: "Error during logout" });
  }
};
