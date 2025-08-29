// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../models/classes/UserModel.js';
import UserDTO from '../models/dto/UserDTO.js';

class AuthController {
  constructor() {
    this.userModel = new UserModel();
  }

  async register(req, res) {
    try {
      const { email, password, name, phone, country, avatarUrl } = req.body;

      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      const userData = { email, password, name, phone, country, avatarUrl };
      const userId = await this.userModel.create(userData);
      const user = await this.userModel.findById(userId);
      const userDTO = new UserDTO(user);

      res.status(201).json({ message: 'Usuario registrado', user: userDTO.toResponse() });
    } catch (err) {
      console.error('Error en register:', err);
      res.status(500).json({ message: 'Error en el servidor', error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      await this.userModel.update(user._id, { lastLoginAt: new Date() });

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );


      const userDTO = new UserDTO(user);
      res.json({ message: 'Login exitoso', token });
      res.status(200).json({ message: 'Login Exitoso'});
    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ message: 'Error en el servidor', error: err.message });
    }
  }
}

export default AuthController;