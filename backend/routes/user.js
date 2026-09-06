import express from 'express';
import * as UserController from '../controllers/UserController.js';

const router = express.Router();

router.post('/', UserController.createUser); 
router.get('/', UserController.getUsers); 
router.get('/:id', UserController.getUserById); 
router.put('/:id', UserController.updateUser); 
router.delete('/:id', UserController.deleteUser);
router.patch('/:id', UserController.partialUpdateUser);

export default router;
