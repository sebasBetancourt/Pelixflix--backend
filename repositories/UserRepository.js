/**
 * UserModel
 * 
 * Este modelo se encarga de manejar la colección "users" en MongoDB.
 * 
 * Responsabilidades:
 *  - Crear nuevos usuarios en la base de datos.
 *  - Consultar usuarios por email o por ID.
 *  - Actualizar y eliminar usuarios.
 *  - Listar usuarios con paginación (skip & limit).
 * 
 * Utiliza:
 *  - getDB(): función que retorna la conexión a la base de datos.
 *  - UserDTO: para estructurar los datos de usuario al crear uno nuevo.
 *  - ObjectId: para trabajar con los identificadores de MongoDB.
 */

const { getDB } = require('../../../config/config'); // Obtiene la conexión a la BD
const { ObjectId } = require('mongodb');            // Conversión de strings a ObjectId
const UserDTO = require('../dto/UserDTO');          // DTO de usuario para estandarizar datos

class UserModel {
  constructor() {
    // Nombre de la colección en la base de datos
    this.collectionName = 'users';
  }

  /**
   * Crea un nuevo usuario en la colección.
   * 
   * @param {Object} userData - Datos del usuario (email, name, password, role, etc.)
   * @returns {String} ID del nuevo usuario insertado.
   */
  async create(userData) {
    const db = getDB();
    // Se estandariza la data con el DTO antes de insertarla
    const userDTO = UserDTO.createFromData(userData);
    const result = await db.collection(this.collectionName).insertOne(userDTO);
    return result.insertedId;
  }

  /**
   * Busca un usuario por su email.
   * 
   * @param {String} email - Email del usuario.
   * @returns {Object|null} Usuario encontrado o null si no existe.
   */
  async findByEmail(email) {
    const db = getDB();
    return await db.collection(this.collectionName).findOne({ email });
  }

  /**
   * Busca un usuario por su ID.
   * 
   * @param {String} id - ID del usuario en formato string.
   * @returns {Object|null} Usuario encontrado o null si no existe.
   * @throws Error si el ID no es válido.
   */
  async findById(id) {
    const db = getDB();
    try {
      return await db.collection(this.collectionName).findOne({ 
        _id: new ObjectId(id) 
      });
    } catch (error) {
      throw new Error('Invalid user ID format');
    }
  }

  /**
   * Actualiza los datos de un usuario por su ID.
   * 
   * @param {String} id - ID del usuario.
   * @param {Object} updateData - Campos a actualizar.
   * @returns {Number} Número de documentos modificados (0 o 1).
   */
  async update(id, updateData) {
    const db = getDB();
    // Se actualiza la fecha de modificación
    updateData.updatedAt = new Date();
    
    const result = await db.collection(this.collectionName).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return result.modifiedCount;
  }

  /**
   * Elimina un usuario por su ID.
   * 
   * @param {String} id - ID del usuario.
   * @returns {Number} Número de documentos eliminados (0 o 1).
   */
  async delete(id) {
    const db = getDB();
    const result = await db.collection(this.collectionName).deleteOne({
      _id: new ObjectId(id)
    });
    
    return result.deletedCount;
  }

  /**
   * Lista usuarios con paginación.
   * 
   * @param {Number} skip - Número de documentos a omitir (paginación).
   * @param {Number} limit - Límite de documentos a devolver.
   * @returns {Array} Lista de usuarios.
   */
  async findAll(skip = 0, limit = 10) {
    const db = getDB();
    return await db.collection(this.collectionName)
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}

// Exportamos el modelo para ser usado en controladores o servicios
module.exports = UserModel;
