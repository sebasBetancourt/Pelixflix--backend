import { Router } from 'express';
import AuthController from '../controllers/controllerAuth.js';
import { registerValidator, loginValidator } from '../middleware/validators/userValidator.js';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/verify', authController.verify);
router.post('/logout', authController.logout);
export default router;