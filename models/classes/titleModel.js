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

      const result = await this.getDb().collection(this.collectionName).insertOne(titleData);
      return result.insertedId;
    } catch (err) {
      throw new Error(`Error al crear título: ${err.message}`);
    }
  }

  // models/TitleModel.js
  static async findById(id) {
    try {
      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "categories",
            localField: "categoriesIds",
            foreignField: "_id",
            as: "categories"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creator"
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            type: 1,
            temps: 1,
            eps: 1,
            year: 1,
            createdAt: 1,
            likes: 1,
            dislikes: 1,
            posterUrl: 1,
            ratingAvg: 1,
            ratingCount: 1,
            status: 1,
            author: 1,
            categories: { $map: { input: "$categories", as: "cat", in: "$$cat.name" } },
            creator: { $arrayElemAt: ["$creator.name", 0] },
            // 👇 si quieres comentarios en DB
            comments: 1
          }
        }
      ];
    
      return await this.getDb().collection(this.collectionName)
        .aggregate(pipeline).next();
    } catch (err) {
      throw new Error(`Error al obtener título: ${err.message}`);
    }
  }

  static async findByName(name) {
    try {
      return await this.getDb().collection(this.collectionName).findOne({ title: name});
    } catch (error) {
      throw new Error('Formato de Nombre inválido');
    }
  }

  static async findAll({ skip = 0, limit = 10, categoryId = null, status = 'approved' } = {}) {
    try {
      const pipeline = [];

      // Filtro base
      const match = {};
      if (categoryId) match.categoriesIds = new ObjectId(categoryId);
      if (status) match.status = status;

      pipeline.push({ $match: match });

      // Unir categorías
      pipeline.push({
        $lookup: {
          from: 'categories', // nombre de la colección de categorías
          localField: 'categoriesIds',
          foreignField: '_id',
          as: 'categories'
        }
      });

      // Unir creador
      pipeline.push({
        $lookup: {
          from: 'users', // colección de usuarios
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      });

      // Proyectar (excluir _id y mostrar lo que necesitas)
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          type: 1,
          temps: 1,
          eps: 1,
          year: 1,
          createdAt: 1,
          likes: 1,
          dislikes: 1,
          posterUrl: 1,
          ratingAvg: 1,
          ratingCount: 1,
          status: 1,
          author: 1,
          categoriesIds: 1,
          createdBy: 1,
          categories: { $map: { input: "$categories", as: "cat", in: "$$cat.name" } },
          creator: { $arrayElemAt: ["$creator.name", 0] }
        }
      });


      // Paginación
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      return await this.getDb().collection(this.collectionName).aggregate(pipeline).toArray();
    } catch (err) {
      throw new Error(`Error al listar todos los títulos: ${err.message}`);
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
