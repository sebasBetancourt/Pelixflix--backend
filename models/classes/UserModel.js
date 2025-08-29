// models/UserModel.js
import database from '../../config/database.js';
import { ObjectId } from 'mongodb';
import UserDTO from '../dto/UserDTO.js';

class UserModel {
  constructor() {
    this.collectionName = 'users';
  }

  getDb() {
    if (!database.isConnected || !database.db) {
      throw new Error('Base de datos no inicializada. Asegúrate de llamar a database.connect() primero.');
    }
    return database.db;
  }

  async create(userData) {
    try {
      const userDTO = await UserDTO.createFromData(userData);
      console.log('Documento a insertar:', JSON.stringify(userDTO, null, 2));
      const result = await this.getDb().collection(this.collectionName).insertOne(userDTO);
      return result.insertedId;
    } catch (err) {
      throw new Error(`Error al crear usuario: ${err.message}`);
    }
  }

  async findByEmail(email) {
    try {
      return await this.getDb().collection(this.collectionName).findOne({ email: email.toLowerCase() });
    } catch (err) {
      throw new Error(`Error al buscar usuario por email: ${err.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.getDb().collection(this.collectionName).findOne({ _id: new ObjectId(id) });
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }

  async update(id, updateData) {
    try {
      updateData.lastLoginAt = new Date();
      const result = await this.getDb().collection(this.collectionName).updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      return result.modifiedCount;
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }

  async delete(id) {
    try {
      const result = await this.getDb().collection(this.collectionName).deleteOne({
        _id: new ObjectId(id)
      });
      return result.deletedCount;
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }

  async findAll(skip = 0, limit = 10) {
    try {
      return await this.getDb().collection(this.collectionName)
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (err) {
      throw new Error(`Error al listar usuarios: ${err.message}`);
    }
  }
}

export default UserModel;