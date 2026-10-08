import { body, query } from 'express-validator'

// Validation for creating a voter
export const createVoterValidation = [
  body('nationalId')
    .notEmpty()
    .withMessage('National ID is required')
    .isString()
    .withMessage('National ID must be a string'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isString()
    .withMessage('Location must be a string')
]

// Validation for updating a voter
export const updateVoterValidation = [
  query('id')
    .notEmpty()
    .withMessage('Voter ID is required')
    .isMongoId()
    .withMessage('Invalid voter ID'),

  body('nationalId')
    .optional()
    .isString()
    .withMessage('National ID must be a string'),

  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
]

// Validation for getting voter by ID
export const getVoterByIdValidation = [
  query('id')
    .notEmpty()
    .withMessage('Voter ID is required')
    .isMongoId()
    .withMessage('Invalid voter ID')
]

// Validation for deleting a voter
export const deleteVoterValidation = [
  query('id')
    .notEmpty()
    .withMessage('Voter ID is required')
    .isMongoId()
    .withMessage('Invalid voter ID')
]
