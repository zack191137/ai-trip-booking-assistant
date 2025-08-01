import Joi from 'joi';

// Auth validation schemas
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required',
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  preferences: Joi.object({
    currency: Joi.string()
      .length(3)
      .uppercase()
      .optional(),
    language: Joi.string()
      .length(2)
      .lowercase()
      .optional(),
    notifications: Joi.boolean()
      .optional(),
  }).optional(),
});

// Conversation validation schemas
export const createConversationSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .optional(), // Optional because it can come from auth middleware
});

export const sendMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(2000)
    .trim()
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 2000 characters',
      'any.required': 'Message content is required',
    }),
});

// Trip validation schemas
export const generateTripSchema = Joi.object({
  conversationId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Conversation ID is required',
    }),
});

export const updateTripSchema = Joi.object({
  destination: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  startDate: Joi.date()
    .iso()
    .min('now')
    .optional(),
  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .optional(),
  travelers: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .optional(),
  status: Joi.string()
    .valid('draft', 'confirmed', 'booked')
    .optional(),
});

// Common validation schemas
export const uuidSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid ID format',
      'any.required': 'ID is required',
    }),
});

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  sortBy: Joi.string()
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional(),
});