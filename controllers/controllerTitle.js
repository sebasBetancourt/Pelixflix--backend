import TitleModel from '../models/classes/titleModel.js';
import TitleDTO from '../models/dto/TitleDTO.js';
import database from '../config/database.js';


const db = database.db;

export class TitleController {


  async create(req, res) {
    try {

      const { title, description, type, year, categoriesIds, posterUrl, author, temps, epds, createdBy } = req.body;

      if (!title || !type || !description || !year || !categoriesIds || !author || !createdBy) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }


      const existingTitle = await TitleModel.findByName(title);
      if (existingTitle) {
        console.log('Titulo ya existe:', title);
        return res.status(400).json({ message: 'El Titulo ya existe, escoge otro nombre' });
      }

      const user = await db.collection('users').findOne({ email: createdBy }).insertedId;

      if (type === 'tv' || type === 'anime') {
        const id = await TitleDTO.createFromDataSerie({
          title,
          description,
          type,
          year,
          createdBy: user,
          categoriesIds: categoriesIds.map(id => new ObjectId(id)),
          posterUrl: posterUrl || "",
          author,
          temps: temps || 1,
          epds: epds || 1
        }); 
        return id; 
      } else if(type === 'movie') {
        const id = await TitleDTO.createFromDataMovie({
          title,
          description,
          type,
          year,
          createdBy: user,
          categoriesIds: categoriesIds.map(id => new ObjectId(id)),
          posterUrl: posterUrl || "",
          author
        });
        return id;
      }

      console.log('Creando Titulo:', id);
      await TitleModel.create(id);
      console.log(id);
      res.status(201).json({ message: 'Título creado exitosamente', id });
    } catch (err) {
      res.status(500).json({ message: 'Error al crear título', error: err.message });
    }
  }

  async list(req, res) {
    try {
      const { skip = 0, limit = 30, categoriesId = null, type = null } = req.query;

      // Llamamos a la función del modelo
      const titles = await TitleModel.findAll({
        skip: parseInt(skip),
        limit: parseInt(limit),
        categoryId: categoriesId, // filtramos por categoryId
        type // filtramos por tipo si se pasa
      });

      res.json(titles);
    } catch (err) {
      console.error(err);
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
