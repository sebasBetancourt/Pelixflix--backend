import database from '../../config/database.js';
import { ObjectId } from 'mongodb';

class TitleModel {
  static collectionName = 'titles';

  static getDb() {
    if (!database.isConnected || !database.db) {
      throw new Error('Base de datos no inicializada. Asegúrate de llamar a database.connect() primero.');
    }
    return database.db;
  }

  static async create(titleData) {
    try {
      const exists = await this.getDb().collection(this.collectionName).findOne({ 
        title: titleData.title 
      });
      if (exists) {
        throw new Error('Ya existe un título con ese nombre');
      }

      const result = await this.getDb().collection(this.collectionName).insertOne({
        ...titleData,
        createdAt: new Date(),
        likes: 0,
        dislikes: 0,
        ratingAvg: 0,
        ratingCount: 0,
        status: 'pending' 
      });
      return result.insertedId;
    } catch (err) {
      throw new Error(`Error al crear título: ${err.message}`);
    }
  }

  static async findById(id) {
    try {
      return await this.getDb().collection(this.collectionName).findOne({ _id: new ObjectId(id) });
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }

  static async findAll({ skip = 0, limit = 10, categoryId = null, status = 'approved' } = {}) {
    try {
      const query = {};
      if (categoryId) query.categoriesIds = new ObjectId(categoryId);
      if (status) query.status = status;

      return await this.getDb().collection(this.collectionName)
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (err) {
      throw new Error(`Error al listar títulos: ${err.message}`);
    }
  }

  static async update(id, updateData) {
    try {
      const result = await this.getDb().collection(this.collectionName).updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      return result.modifiedCount;
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }

  static async delete(id) {
    try {
      const result = await this.getDb().collection(this.collectionName).deleteOne({
        _id: new ObjectId(id)
      });
      return result.deletedCount;
    } catch (error) {
      throw new Error('Formato de ID inválido');
    }
  }
}

export default TitleModel;
