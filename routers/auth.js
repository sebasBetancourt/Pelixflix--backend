import { Router } from 'express';
import AuthController from '../controllers/controllerAuth.js';
import { registerValidator, loginValidator } from '../middleware/validators/userValidator.js';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidator, authController.register.bind(authController));
router.post('/login', loginValidator, authController.login.bind(authController));
router.get('/verify', authController.verify.bind(authController));
export default router;