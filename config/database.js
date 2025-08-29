import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

/**
 * Clase Database
 * -----------------------------
 * Maneja la conexión con MongoDB y operaciones comunes.
 * Optimizado para MongoDB Atlas con configuración mejorada.
 * 
 * Funcionalidades principales:
 *  - Conectar y desconectar de la base de datos.
 *  - Configurar colecciones e índices al iniciar.
 *  - Operaciones CRUD y transaccionales (ej. reseñas + actualización de rating).
 *  - Métodos de utilidad como crear usuarios y buscar títulos.
 */
class Database {
  constructor() {
    this.client = null;       // Cliente de MongoDB
    this.db = null;           // Instancia de la base de datos
    this.isConnected = false; // Estado de conexión
  }

  /**
   * Conecta a MongoDB Atlas y configura colecciones.
   * @param {string} uri - URI de conexión de MongoDB Atlas.
   * @param {string} dbName - Nombre de la base de datos.
   */
  // En config/database.js, modifica el método connect
async connect(uri, dbName) {
  try {
    console.log('Intentando conectar a MongoDB Atlas...');
    if (!uri) {
      throw new Error('MONGODB_URI is undefined. Set MONGODB_URI in your environment or .env file');
    }
    console.log('URI:', String(uri).replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')); // Oculta credenciales en logs
    
    this.client = new MongoClient(uri, {
      // Opciones compatibles con el driver moderno (v4+)
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    await this.client.connect();
    this.db = this.client.db(dbName);
    this.isConnected = true;
    
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
    console.log('📊 Base de datos:', dbName);
    
    // Mostrar información del cluster
    try {
      const adminDb = this.client.db().admin();
      const serverInfo = await adminDb.serverInfo();
      console.log('🔧 Versión de MongoDB:', serverInfo.version);
      console.log('🖥️  Host:', serverInfo.host);
    } catch (infoError) {
      console.log('ℹ️  Info adicional no disponible:', infoError.message);
    }
    
    // Configurar colecciones e índices al iniciar
    await this.setupCollections();
    
    return this;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:');
    console.error('🔍 Mensaje:', error.message);
    console.error('📋 Código:', error.code);
    console.error('🔗 URI usada:', uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    if (!uri) {
      console.error('🔗 URI usada: <undefined>');
    }
    
    // Errores comunes y sus soluciones
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Solución: Verifica tu conexión a internet y el nombre del cluster');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Solución: Verifica que MongoDB esté ejecutándose y la IP esté whitelisted en Atlas');
    } else if (error.code === 'ETIMEOUT') {
      console.error('💡 Solución: Timeout de conexión. Verifica tu red o aumenta el timeout');
    } else if (error.message.includes('auth failed')) {
      console.error('💡 Solución: Verifica usuario y contraseña en la URI de conexión');
    } else if (error.message.includes('bad auth')) {
      console.error('💡 Solución: Las credenciales son incorrectas o el usuario no existe');
    }
    
    throw error;
  }
}

  /**
   * Cierra la conexión con MongoDB.
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Desconectado de MongoDB');
    }
  }

  /**
   * Configura todas las colecciones necesarias para la app.
   * Aquí se crean índices, validaciones o estructuras iniciales.
   */
  async setupCollections() {
    await this.setupUsersCollection();
    await this.setupTitlesCollection();
    await this.setupCategoriesCollection();
    await this.setupReviewsCollection();
    await this.setupReviewReactionsCollection();
    await this.setupListsCollection();
    await this.setupTokensCollection();
    await this.setupExportsJobsCollection();
    await this.setupAuditLogsCollection(); // opcional

    console.log('Colecciones e índices configurados correctamente');
  }

  // ==================== CONFIGURACIÓN DE COLECCIONES ====================

  /**
   * Configura la colección de usuarios con índices y validaciones
   */
  async setupUsersCollection() {
    const usersCollection = this.db.collection('users');
    
    // Crear índices
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ createdAt: 1 });
    
    // Validación de esquema (MongoDB 3.6+)
    try {
      await this.db.command({
        collMod: 'users',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'passwordHash', 'role', 'createdAt'],
            properties: {
              email: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              passwordHash: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              role: {
                enum: ['user', 'admin'],
                description: 'Debe ser "user" o "admin"',
              },
              name: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              phone: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              country: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              avatarUrl: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              lastLoginAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha',
              },
              banned: {
                bsonType: 'bool',
                description: 'Debe ser un booleano',
              },
              preferences: {
                bsonType: 'object',
                description: 'Debe ser un objeto',
                properties: {
                  marketingEmails: { bsonType: 'bool' },
                  personalizedRecs: { bsonType: 'bool' },
                  shareAnonymized: { bsonType: 'bool' },
                  dataRetentionMonths: { bsonType: 'number' },
                },
              },
              lists: {
                bsonType: 'array',
                description: 'Debe ser un array',
                items: {
                  bsonType: 'object',
                  properties: {
                    itemId: { bsonType: 'objectId' },
                    type: { bsonType: 'string' },
                    addedAt: { bsonType: 'date' },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de títulos (películas/series) con índices y validaciones
   */
  async setupTitlesCollection() {
    const titlesCollection = this.db.collection('titles');
    
    // Crear índices
    await titlesCollection.createIndex(
      { title: "text", description: "text" },
      { name: "TextIndex" }
    );
    await titlesCollection.createIndex({ type: 1, status: 1, createdAt: -1 });
    await titlesCollection.createIndex({ genres: 1 });
    await titlesCollection.createIndex(
      { title: 1, year: 1, type: 1 },
      { unique: true, partialFilterExpression: { title: { $exists: true } } }
    );
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'titles',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['type', 'title', 'status', 'createdAt'],
            properties: {
              externalId: {
                bsonType: ['string', 'null'],
                description: 'Debe ser un string o null',
              },
              type: {
                enum: ['movie', 'tv', 'anime'],
                description: 'Debe ser "movie", "tv" o "anime"',
              },
              title: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              description: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              author: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              year: {
                bsonType: 'number',
                description: 'Debe ser un número',
              },
              genres: {
                bsonType: 'array',
                description: 'Debe ser un array de strings',
                items: { bsonType: 'string' },
              },
              categoriesIds: {
                bsonType: 'array',
                description: 'Debe ser un array de objectIds',
                items: { bsonType: 'objectId' },
              },
              posterUrl: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              images: {
                bsonType: 'array',
                description: 'Debe ser un array de strings',
                items: { bsonType: 'string' },
              },
              status: {
                enum: ['pending', 'approved', 'rejected'],
                description: 'Debe ser "pending", "approved" o "rejected"',
              },
              ratingAvg: {
                bsonType: 'number',
                minimum: 0,
                maximum: 10,
                description: 'Debe ser un número entre 0 y 10',
              },
              ratingCount: {
                bsonType: 'number',
                minimum: 0,
                description: 'Debe ser un número no negativo',
              },
              likes: {
                bsonType: 'number',
                minimum: 0,
                description: 'Debe ser un número no negativo',
              },
              dislikes: {
                bsonType: 'number',
                minimum: 0,
                description: 'Debe ser un número no negativo',
              },
              createdBy: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha',
              },
              metadata: {
                bsonType: 'object',
                description: 'Debe ser un objeto',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de categorías con índices y validaciones
   */
  async setupCategoriesCollection() {
    const categoriesCollection = this.db.collection('categories');
    
    // Crear índices
    await categoriesCollection.createIndex({ slug: 1 }, { unique: true });
    await categoriesCollection.createIndex({ name: 1 }, { unique: true });
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'categories',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'slug', 'createdAt'],
            properties: {
              name: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              slug: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de reseñas con índices y validaciones
   */
  async setupReviewsCollection() {
    const reviewsCollection = this.db.collection('reviews');
    
    // Crear índices
    await reviewsCollection.createIndex({ titleId: 1 });
    await reviewsCollection.createIndex({ userId: 1 });
    await reviewsCollection.createIndex({ reported: 1 });
    await reviewsCollection.createIndex({ createdAt: -1 });
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'reviews',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['titleId', 'userId', 'score', 'createdAt'],
            properties: {
              titleId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              userId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              title: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              comment: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              score: {
                bsonType: 'number',
                minimum: 1,
                maximum: 10,
                description: 'Debe ser un número entre 1 y 10 y es requerido',
              },
              likesCount: {
                bsonType: 'number',
                minimum: 0,
                description: 'Debe ser un número no negativo',
              },
              dislikesCount: {
                bsonType: 'number',
                minimum: 0,
                description: 'Debe ser un número no negativo',
              },
              reported: {
                bsonType: 'bool',
                description: 'Debe ser un booleano',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de reacciones a reseñas con índices y validaciones
   */
  async setupReviewReactionsCollection() {
    const reviewReactionsCollection = this.db.collection('review_reactions');
    
    // Crear índices
    await reviewReactionsCollection.createIndex(
      { reviewId: 1, userId: 1 },
      { unique: true }
    );
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'review_reactions',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['reviewId', 'userId', 'type', 'createdAt'],
            properties: {
              reviewId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              userId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              type: {
                enum: ['like', 'dislike'],
                description: 'Debe ser "like" o "dislike" y es requerido',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de listas de usuarios con índices y validaciones
   */
  async setupListsCollection() {
    const listsCollection = this.db.collection('lists');
    
    // Crear índices
    await listsCollection.createIndex({ userId: 1 });
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'lists',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'name', 'createdAt'],
            properties: {
              userId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              name: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              items: {
                bsonType: 'array',
                description: 'Debe ser un array',
                items: {
                  bsonType: 'object',
                  required: ['itemId', 'type', 'addedAt'],
                  properties: {
                    itemId: { bsonType: 'objectId' },
                    type: { bsonType: 'string' },
                    addedAt: { bsonType: 'date' },
                    meta: {
                      bsonType: 'object',
                      properties: {
                        title: { bsonType: 'string' },
                        posterUrl: { bsonType: 'string' },
                      },
                    },
                  },
                },
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de tokens de sesión con índices y validaciones
   */
  async setupTokensCollection() {
    const tokensCollection = this.db.collection('tokens');
    
    // Crear índices
    await tokensCollection.createIndex({ userId: 1 });
    await tokensCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'tokens',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'hash', 'createdAt', 'expiresAt'],
            properties: {
              userId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              hash: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              deviceInfo: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              ip: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              expiresAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              revoked: {
                bsonType: 'bool',
                description: 'Debe ser un booleano',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de trabajos de exportación con índices y validaciones
   */
  async setupExportsJobsCollection() {
    const exportsJobsCollection = this.db.collection('exports_jobs');
    
    // Crear índices
    await exportsJobsCollection.createIndex({ userId: 1 });
    await exportsJobsCollection.createIndex({ status: 1 });
    await exportsJobsCollection.createIndex({ createdAt: 1 });
    
    // Validación de esquema
    try {
      await this.db.command({
        collMod: 'exports_jobs',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'status', 'createdAt'],
            properties: {
              userId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              status: {
                enum: ['pending', 'processing', 'done', 'failed'],
                description: 'Debe ser "pending", "processing", "done" o "failed" y es requerido',
              },
              url: {
                bsonType: ['string', 'null'],
                description: 'Debe ser un string o null',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
              completedAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha',
              },
              meta: {
                bsonType: 'object',
                description: 'Debe ser un objeto',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  /**
   * Configura la colección de logs de auditoría (opcional) con índices
   */
  async setupAuditLogsCollection() {
    const auditLogsCollection = this.db.collection('audit_logs');
    
    // Crear índices
    await auditLogsCollection.createIndex({ actorId: 1 });
    await auditLogsCollection.createIndex({ targetType: 1, targetId: 1 });
    await auditLogsCollection.createIndex({ createdAt: -1 });
    
    // Validación de esquema (opcional)
    try {
      await this.db.command({
        collMod: 'audit_logs',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['actorId', 'action', 'createdAt'],
            properties: {
              actorId: {
                bsonType: 'objectId',
                description: 'Debe ser un objectId y es requerido',
              },
              action: {
                bsonType: 'string',
                description: 'Debe ser un string y es requerido',
              },
              targetType: {
                bsonType: 'string',
                description: 'Debe ser un string',
              },
              targetId: {
                bsonType: ['objectId', 'string'],
                description: 'Debe ser un objectId o string',
              },
              details: {
                bsonType: 'object',
                description: 'Debe ser un objeto',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Debe ser una fecha y es requerido',
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('Nota: La validación de esquema puede no estar disponible en tu versión de MongoDB');
    }
  }

  // ==================== OPERACIONES TRANSACCIONALES ====================

  /**
   * Ejemplo de operación transaccional:
   * Crear reseña y actualizar rating promedio del título asociado.
   */
  async createReviewWithTransaction(reviewData) {
    const session = this.client.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // 1. Insertar la reseña
        const reviewsCollection = this.db.collection('reviews');
        const result = await reviewsCollection.insertOne(reviewData, { session });
        
        // 2. Recalcular promedio del título
        const titlesCollection = this.db.collection('titles');
        const titleReviews = await reviewsCollection.find(
          { titleId: reviewData.titleId },
          { session }
        ).toArray();
        
        const totalScore = titleReviews.reduce((sum, review) => sum + review.score, 0);
        const ratingAvg = totalScore / titleReviews.length;
        const ratingCount = titleReviews.length;
        
        // 3. Actualizar el título con el nuevo rating
        await titlesCollection.updateOne(
          { _id: reviewData.titleId },
          { 
            $set: { 
              ratingAvg: parseFloat(ratingAvg.toFixed(1)),
              ratingCount,
              updatedAt: new Date()
            }
          },
          { session }
        );
        
        return result;
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Actualizar una reseña y recalcular el rating (transaccional)
   */
  async updateReviewWithTransaction(reviewId, updates) {
    const session = this.client.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const reviewsCollection = this.db.collection('reviews');
        const titlesCollection = this.db.collection('titles');
        
        // 1. Obtener la reseña actual
        const currentReview = await reviewsCollection.findOne(
          { _id: new ObjectId(reviewId) },
          { session }
        );
        
        if (!currentReview) {
          throw new Error('Reseña no encontrada');
        }
        
        // 2. Actualizar la reseña
        const result = await reviewsCollection.updateOne(
          { _id: new ObjectId(reviewId) },
          { $set: { ...updates, updatedAt: new Date() } },
          { session }
        );
        
        // 3. Recalcular rating promedio si el score cambió
        if (updates.score && updates.score !== currentReview.score) {
          const titleReviews = await reviewsCollection.find(
            { titleId: currentReview.titleId },
            { session }
          ).toArray();
          
          const totalScore = titleReviews.reduce((sum, review) => {
            return sum + (review._id.toString() === reviewId ? updates.score : review.score);
          }, 0);
          
          const ratingAvg = totalScore / titleReviews.length;
          const ratingCount = titleReviews.length;
          
          await titlesCollection.updateOne(
            { _id: currentReview.titleId },
            { 
              $set: { 
                ratingAvg: parseFloat(ratingAvg.toFixed(1)),
                ratingCount,
                updatedAt: new Date()
              }
            },
            { session }
          );
        }
        
        return result;
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Eliminar una reseña y recalcular el rating (transaccional)
   */
  async deleteReviewWithTransaction(reviewId) {
    const session = this.client.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const reviewsCollection = this.db.collection('reviews');
        const titlesCollection = this.db.collection('titles');
        
        // 1. Obtener la reseña a eliminar
        const reviewToDelete = await reviewsCollection.findOne(
          { _id: new ObjectId(reviewId) },
          { session }
        );
        
        if (!reviewToDelete) {
          throw new Error('Reseña no encontrada');
        }
        
        // 2. Eliminar la reseña
        await reviewsCollection.deleteOne(
          { _id: new ObjectId(reviewId) },
          { session }
        );
        
        // 3. Recalcular rating promedio para el título
        const titleReviews = await reviewsCollection.find(
          { titleId: reviewToDelete.titleId },
          { session }
        ).toArray();
        
        let ratingAvg = 0;
        let ratingCount = titleReviews.length;
        
        if (ratingCount > 0) {
          const totalScore = titleReviews.reduce((sum, review) => sum + review.score, 0);
          ratingAvg = totalScore / ratingCount;
        }
        
        await titlesCollection.updateOne(
          { _id: reviewToDelete.titleId },
          { 
            $set: { 
              ratingAvg: parseFloat(ratingAvg.toFixed(1)),
              ratingCount,
              updatedAt: new Date()
            }
          },
          { session }
        );
        
        return { deletedCount: 1 };
      });
    } finally {
      await session.endSession();
    }
  }

  // ==================== MÉTODOS DE UTILIDAD ====================

  /**
   * Devuelve un usuario buscado por su email.
   * @param {string} email 
   * @returns {Object|null}
   */
  async getUserByEmail(email) {
    return this.db.collection('users').findOne({ email: email.toLowerCase() });
  }

  /**
   * Crea un usuario en la colección "users".
   * - Hash de la contraseña.
   * - Datos base del perfil.
   * - Preferencias iniciales.
   */
  async createUser(userData) {
    const usersCollection = this.db.collection('users');
    
    // Hash de contraseña antes de guardarla
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const userDocument = {
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role || 'user',
      name: userData.name || '',
      phone: userData.phone || '',
      country: userData.country || '',
      avatarUrl: userData.avatarUrl || '',
      createdAt: new Date(),
      lastLoginAt: null,
      banned: false,
      preferences: {
        marketingEmails: userData.preferences?.marketingEmails || false,
        personalizedRecs: userData.preferences?.personalizedRecs || true,
        shareAnonymized: userData.preferences?.shareAnonymized || false,
        dataRetentionMonths: userData.preferences?.dataRetentionMonths || 24,
      },
      lists: [],
    };
    
    return usersCollection.insertOne(userDocument);
  }

  /**
   * Busca títulos aplicando filtros y paginación.
   * - Soporta búsqueda de texto (MongoDB $text).
   * - Aplica filtros como tipo, géneros o año.
   * - Ordena por relevancia o fecha.
   */
  async searchTitles(query, filters = {}) {
    const titlesCollection = this.db.collection('titles');
    
    // Filtro base: títulos aprobados
    const searchFilter = { status: 'approved' };
    
    // Si hay búsqueda por texto
    if (query) {
      searchFilter.$text = { $search: query };
    }
    
    // Filtros adicionales
    if (filters.type) searchFilter.type = filters.type;
    if (filters.genres && filters.genres.length > 0) {
      searchFilter.genres = { $in: filters.genres };
    }
    if (filters.year) searchFilter.year = filters.year;
    
    // Opciones de consulta
    const options = {
      limit: filters.limit || 20,
      skip: filters.skip || 0,
    };
    
    // Ordenar resultados
    if (query) {
      options.sort = { score: { $meta: 'textScore' } };
    } else {
      options.sort = { createdAt: -1 };
    }
    
    return titlesCollection.find(searchFilter, options).toArray();
  }

  /**
   * Obtiene una colección por nombre
   * @param {string} collectionName - Nombre de la colección
   * @returns {Collection} Instancia de la colección MongoDB
   */
  getCollection(collectionName) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db.collection(collectionName);
  }
}

// Exportar una instancia única (singleton)
const database = new Database();
export default database;