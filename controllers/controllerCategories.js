import CategoriesModel from '../models/classes/CategoriesModel.js';
import CategoriesDTO from '../models/dto/CategoriesDTO.js';
import database from '../config/database.js';


const db = database.db;

export class CategoriesController {


  async create(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo los administradores pueden crear categorias' });
      }

      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Faltan campos obligatorios, Nombre de la caategoria' });
      }


      const existingCategoria = await CategoriesModel.findByName(name);
      if (existingCategoria) {
        console.log('Categoria ya existe:', title);
        return res.status(400).json({ message: 'La categoria ya existe, escoge otro nombre' });
      }


      const categor = await CategoriesDTO.createFromDataCategories({
          name,
          createdAt: new Date()
        }); 

      console.log('Creando Categoria:', categor);
      await CategoriesModel.create(categor);
      console.log(id);
      res.status(201).json({ message: 'Categoria creada exitosamente', categor });
    } catch (err) {
      res.status(500).json({ message: 'Error al crear categoria', error: err.message });
    }
  }

  async list(req, res) {
    try {
      const { skip, limit, categoriesId } = req.query;
      const titles = await TitleModel.findAll({ 
        skip: parseInt(skip) || 0, 
        limit: parseInt(limit) || 10, 
        categoriesId 
      });
      res.json(titles);
    } catch (err) {
      res.status(500).json({ message: 'Error al listar títulos', error: err.message });
    }
  }
  async getById(req, res) {
    try {
      const { id } = req.params;
      const title = await TitleModel.findById(id);
    
      if (!title) return res.status(404).json({ message: "Título no encontrado" });
      res.json(title);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener título", error: err.message });
    }
  }

  async detail(req, res) {
    try {
      const title = await TitleModel.findById(req.params.id);
      if (!title) return res.status(404).json({ message: 'Título no encontrado' });
      res.json(title);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener título', error: err.message });
    }
  }

  async approve(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo los administradores pueden aprobar títulos' });
      }

      const updated = await TitleModel.update(req.params.id, { status: 'approved' });
      if (!updated) return res.status(404).json({ message: 'Título no encontrado' });

      res.json({ message: 'Título aprobado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al aprobar título', error: err.message });
    }
  }

  async delete(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo los administradores pueden eliminar títulos' });
      }

      const deleted = await TitleModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Título no encontrado' });

      res.json({ message: 'Título eliminado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar título', error: err.message });
    }
  }
}

export default TitleController;
