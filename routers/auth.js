// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import database from '../config/database.js'
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const db = database.db;
    const { email, password, name } = req.body;

    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      email: email.toLowerCase(),
      passwordHash,                
      role: "user",
      name: name || "",
      createdAt: new Date(),
      lastLoginAt: null,
      banned: false,
      preferences: {
        marketingEmails: false,
        personalizedRecs: true,
        shareAnonymized: false,
        dataRetentionMonths: 24
      },
      lists: []
    };

    const result = await db.collection("users").insertOne(newUser);

    res.json({ message: "Usuario registrado", userId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const db = database.db;
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    // 👇 aquí el fix importante: usar user.passwordHash
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Credenciales inválidas" });

    // opcional: actualizar lastLoginAt
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: "Login exitoso", token });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

export default router;
