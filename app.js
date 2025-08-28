// app.js
import dotenv from "dotenv";
import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar swagger.json usando readFileSync
const swaggerDocumentJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8')
);

import swaggerUi from 'swagger-ui-express';
import UserRouter from "./routers/UserRouter.js";
import versionRouter from "./routers/versionRouter.js";
import database from "./config/database.js";
import { limiter } from "./middlewares/limiter.js";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./routers/auth.js";
import userRoutes from "./routers/user.js";

// Configuración
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport
app.use(passport.initialize());
configurePassport(passport);

// Rate limiting global
app.use(limiter);

// Rutas
app.use("/users", UserRouter);
app.use("/version", versionRouter);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// Documentación API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentJson));

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    database: database.isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba de base de datos
app.get('/test-db', async (req, res) => {
  try {
    const usersCollection = database.getCollection('users');
    const userCount = await usersCollection.countDocuments();
    
    res.json({
      database: database.isConnected ? 'connected' : 'disconnected',
      userCount: userCount,
      message: 'Conexión a la base de datos verificada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error conectando a la base de datos',
      details: error.message
    });
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  
  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }
  
  // Errores de base de datos
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      error: 'Error de base de datos',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }
  
  // Error por defecto
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Inicializar servidor con conexión a base de datos
async function startServer() {
  try {
    // Conectar a la base de datos
    await database.connect(process.env.MONGODB_URI, process.env.DB_NAME);
    console.log('Base de datos conectada correctamente');
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor ejecutándose en http://localhost:${port}`);
      console.log(`Documentación API disponible en http://localhost:${port}/api-docs`);
      console.log(`Health check disponible en http://localhost:${port}/health`);
      console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Manejo graceful de shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\nRecibido ${signal}, cerrando servidor gracefulmente...`);
      
      // Cerrar servidor
      process.exit(0);
    };
    
    // Manejadores para señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer().catch(error => {
  console.error('Error crítico al iniciar servidor:', error);
  process.exit(1);
});

// Agrega estas rutas después de tus otras rutas en app.js

// Ruta de salud con verificación de base de datos
app.get('/health', async (req, res) => {
  try {
    // Intentar una operación simple de base de datos
    const adminDb = database.client.db().admin();
    const serverStatus = await adminDb.serverStatus();
    const dbStats = await database.db.stats();
    
    res.status(200).json({ 
      status: 'OK', 
      database: {
        connected: database.isConnected,
        host: serverStatus.host,
        version: serverStatus.version,
        db: dbStats.db,
        collections: dbStats.collections,
        objects: dbStats.objects
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Ruta para listar todas las colecciones
app.get('/test/collections', async (req, res) => {
  try {
    const collections = await database.db.listCollections().toArray();
    res.json({
      success: true,
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para probar operaciones CRUD básicas
app.get('/test/db-operations', async (req, res) => {
  try {
    const testCollection = database.db.collection('test_connection');
    
    // Crear documento
    const insertResult = await testCollection.insertOne({
      test: 'Conexión exitosa',
      timestamp: new Date(),
      randomId: Math.random().toString(36).substring(7)
    });
    
    // Leer documento
    const document = await testCollection.findOne({ _id: insertResult.insertedId });
    
    // Contar documentos
    const count = await testCollection.countDocuments();
    
    // Limpiar prueba
    await testCollection.deleteMany({ test: 'Conexión exitosa' });
    
    res.json({
      success: true,
      operations: {
        insert: insertResult.acknowledged,
        read: document !== null,
        count: count,
        delete: true
      },
      document: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para ver estadísticas de la base de datos
app.get('/test/db-stats', async (req, res) => {
  try {
    const stats = await database.db.stats();
    res.json({
      success: true,
      stats: {
        db: stats.db,
        collections: stats.collections,
        views: stats.views,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default app;