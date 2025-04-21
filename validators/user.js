import Joi from "joi";

export const userRegisterSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Username is required.',
      'string.min': 'Username must be at least 3 characters.',
      'string.max': 'Username must not exceed 30 characters.',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required.',
      'string.email': 'Please provide a valid email address.',
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must be between 10 and 15 digits.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 6 characters.',
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Confirm password must match password.',
      'string.empty': 'Confirm password is required.',
    }),

  role: Joi.string()
    .valid('admin', 'organizer', 'attendee')
    .required()
    .messages({
      'any.only': 'Role must be one of admin, organizer, or attendee.',
      'string.empty': 'Role is required.',
    }),
});



export const loginValidator = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),  // email is optional but must be valid
  phone: Joi.any().optional(),  // phone number is optional and should follow a specific pattern (e.g., 10 digits)
  password: Joi.string().min(6).required()  // password must be at least 6 characters long
}).or('username', 'email', 'phone');  

export default loginValidator;
