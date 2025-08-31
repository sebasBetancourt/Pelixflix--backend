import TitleModel from '../models/classes/titleModel.js';

export class TitleController {
  async create(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo los administradores pueden crear títulos' });
      }

      const { title, description, type, year, categoriesIds, posterUrl, author, temps, epds } = req.body;

      if (!title || !description || !year || !categoriesIds) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }

      const id = await TitleModel.create({
        title,
        description,
        type,
        year,
        categoriesIds: categoriesIds.map(id => new ObjectId(id)),
        posterUrl: posterUrl || null,
        author,
        temps: temps || null,
        epds: epds || null
      });

      res.status(201).json({ message: 'Título creado exitosamente', id });
    } catch (err) {
      res.status(500).json({ message: 'Error al crear título', error: err.message });
    }
  }

  // Listar
  async list(req, res) {
    try {
      const { skip, limit, categoryId } = req.query;
      const titles = await TitleModel.findAll({ 
        skip: parseInt(skip) || 0, 
        limit: parseInt(limit) || 10, 
        categoryId 
      });
      res.json(titles);
    } catch (err) {
      res.status(500).json({ message: 'Error al listar títulos', error: err.message });
    }
  }

  // Ver detalle
  async detail(req, res) {
    try {
      const title = await TitleModel.findById(req.params.id);
      if (!title) return res.status(404).json({ message: 'Título no encontrado' });
      res.json(title);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener título', error: err.message });
    }
  }

  // Aprobar título (solo admin)
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

  // Eliminar (admin)
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
