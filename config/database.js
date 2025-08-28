// config/database.js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

/**
 * Clase Database
 * -----------------------------
 * Maneja la conexión con MongoDB y operaciones comunes.
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
   * Conecta a MongoDB y configura colecciones.
   * @param {string} uri - URI de conexión (ej. Mongo Atlas).
   * @param {string} dbName - Nombre de la base de datos.
   */
  async connect(uri, dbName) {
    try {
      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      
      console.log('Conectado a MongoDB');
      
      // Configurar colecciones e índices al iniciar
      await this.setupCollections();
      
      return this;
    } catch (error) {
      console.error('Error conectando a MongoDB:', error);
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
}

module.exports = new Database();
