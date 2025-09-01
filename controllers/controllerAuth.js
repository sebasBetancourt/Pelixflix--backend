import UserModel from '../models/classes/UserModel.js'; 
import  UserDTO  from '../models/dto/UserDTO.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';





export class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Intento de login con:', { email, password }); 

      const user = await UserModel.findByEmail(email);
      if (!user) {
        console.log('Usuario no encontrado:', email);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        console.log('Contraseña incorrecta para:', email);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      await UserModel.update(user._id, { lastLoginAt: new Date() });

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );

      const userDTO = new UserDTO(user);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", 
        maxAge: 1000 * 60 * 60 * 24,
      });
    
      res.json({
        message: "Login exitoso",
        user: {
          email: userDTO.email,
          role: userDTO.role
        }
      });
    
    } catch (err) {
      console.error("Error en login:", err);
      res.status(500).json({ message: "Error en el servidor", error: err.message });
    }
  }

  async register(req, res) {
    try {
      const { email, name, password, phone, country } = req.body;
      console.log('Datos recibidos en register:', req.body);

      if (!email || !name || !password) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: email, name, password' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        console.log('Usuario ya existe:', email);
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const data = await UserDTO.createFromData({
        email,
        name,
        passwordHash: hashedPassword,
        phone: phone,
        country: country,
        role: 'user'
      });

      console.log('Creando usuario:', data);
      await UserModel.create(data);
      console.log(data);
      
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
      console.error('Error en register:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Error de validación en la base de datos', error: err.message });
      }
      res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
    }
  }

  async verify(req, res) {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ message: "No se proporcionó token" });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findByEmail(decoded.email);
  
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
  
      res.json({ message: "Token válido", user: { email: user.email, role: user.role } });
    } catch (err) {
      console.error("Error en verify:", err);
      res.status(401).json({ message: "Token inválido", error: err.message });
    }
  }
  

  async logout(req, res) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.clearCookie("user");
    res.json({ message: "Logout exitoso" });
  }
  
  
}

export default AuthController;