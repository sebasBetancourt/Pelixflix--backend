/**
 * UserServices
 * 
 * Servicio encargado de manejar la lógica de negocio relacionada con usuarios.
 * 
 * Responsabilidades:
 *  - Registrar usuarios.
 *  - Validar credenciales (login).
 *  - Obtener, actualizar y eliminar usuarios.
 *  - Listar usuarios con paginación y filtros.
 *  - Controlar permisos según rol (user/admin).
 */

const UserRepository = require('../repositories/UserRepository'); // Repositorio para acceso a la DB
const bcrypt = require('bcrypt');                                  // Para encriptar y comparar contraseñas
const UserDTO = require('../models/dto/UserDTO');                  // DTO para estandarizar datos de usuario

class UserServices {
  constructor() {
    // Inicializa el repositorio de usuarios
    this.userRepository = new UserRepository();
  }

  /**
   * Registra un nuevo usuario.
   * - Verifica que el email no exista.
   * - Valida que las contraseñas coincidan.
   * - Hashea la contraseña antes de guardarla.
   * 
   * @param {Object} userData - Datos de registro (email, name, password, confirmPassword, role, avatar)
   * @returns {UserDTO} Usuario creado.
   */
  async registerUser(userData) {
    const existingUser = await this.userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const userToCreate = {
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role || 'user',
      avatar: userData.avatar || null
    };

    const userId = await this.userRepository.createUser(userToCreate);
    const user = await this.userRepository.findUserById(userId);
    
    return new UserDTO(user);
  }

  /**
   * Valida credenciales de usuario.
   * - Busca usuario por email.
   * - Compara la contraseña ingresada con la hasheada.
   * 
   * @param {String} email 
   * @param {String} password 
   * @returns {UserDTO} Usuario validado.
   */
  async validateUser(email, password) {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    return new UserDTO(user);
  }

  /**
   * Obtiene un usuario por su ID.
   * 
   * @param {String} id 
   * @returns {UserDTO} Usuario encontrado.
   */
  async getUserById(id) {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return new UserDTO(user);
  }

  /**
   * Actualiza datos de un usuario.
   * - Solo admins o el propio usuario pueden actualizar.
   * - No permite cambiar rol si no es admin.
   * - Hashea nueva contraseña si se actualiza.
   * - Bloquea actualización de email y _id.
   * 
   * @param {String} id 
   * @param {Object} updateData 
   * @param {UserDTO} currentUser - Usuario que realiza la acción
   * @returns {UserDTO} Usuario actualizado.
   */
  async updateUser(id, updateData, currentUser) {
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new Error('Not authorized to update this user');
    }

    if (updateData.role && currentUser.role !== 'admin') {
      delete updateData.role;
    }

    if (updateData.password) {
      if (updateData.password !== updateData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.confirmPassword;
    }

    delete updateData.email;
    delete updateData._id;

    const modifiedCount = await this.userRepository.updateUser(id, updateData);
    if (modifiedCount === 0) {
      throw new Error('User not found or no changes made');
    }

    return await this.getUserById(id);
  }

  /**
   * Elimina un usuario por su ID.
   * - Solo admins pueden eliminar usuarios.
   * - No permite que un admin se elimine a sí mismo.
   * 
   * @param {String} id 
   * @param {UserDTO} currentUser 
   * @returns {Object} Mensaje de éxito.
   */
  async deleteUser(id, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Not authorized to delete users');
    }

    if (currentUser.id === id) {
      throw new Error('Cannot delete your own account');
    }

    const deletedCount = await this.userRepository.deleteUser(id);
    if (deletedCount === 0) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  /**
   * Obtiene todos los usuarios con paginación y filtros.
   * - Solo admins pueden acceder.
   * 
   * @param {Number} page 
   * @param {Number} limit 
   * @param {Object} filters 
   * @param {UserDTO} currentUser 
   * @returns {Object} Lista de usuarios y paginación.
   */
  async getAllUsers(page = 1, limit = 10, filters = {}, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Not authorized to view all users');
    }

    const skip = (page - 1) * limit;
    const result = await this.userRepository.findAllUsers(skip, limit, filters);
    
    return {
      users: result.users.map(user => new UserDTO(user)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    };
  }

  /**
   * Obtiene estadísticas de usuarios.
   * - Solo admins pueden acceder.
   */
  async getUsersStats(currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Not authorized to view statistics');
    }

    return await this.userRepository.getUserStats();
  }

  /**
   * Busca usuarios por término de búsqueda.
   * - Solo admins pueden acceder.
   */
  async searchUsers(searchTerm, page = 1, limit = 10, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Not authorized to search users');
    }

    const filters = { search: searchTerm };
    return await this.getAllUsers(page, limit, filters, currentUser);
  }
}

// Exporta la clase para usar en controladores o rutas
module.exports = UserServices;
