/**
 * UserDTO (Data Transfer Object)
 * 
 * Esta clase se encarga de:
 *  - Estandarizar los datos de un usuario.
 *  - Evitar exponer información sensible (como contraseñas).
 *  - Preparar la información para guardar en base de datos o devolver como respuesta en una API.
 */

class UserDTO {

  /**
   * Constructor de la clase.
   * Recibe un objeto `user` (normalmente desde la base de datos) y lo transforma.
   * 
   * @param {Object} user - Datos del usuario (documento de MongoDB o similar).
   */
  constructor(user) {
    // MongoDB guarda el id como ObjectId, lo convertimos a string para manejarlo más fácil.
    this.id = user._id ? user._id.toString() : null;

    // Guardamos datos principales
    this.email = user.email;
    this.name = user.name;

    // Si no tiene rol asignado, se le pone "user" por defecto.
    this.role = user.role || 'user';

    // Fechas de creación y actualización
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
  
  /**
   * Método estático que crea un objeto con la información necesaria
   * para insertar un nuevo usuario en la base de datos.
   * 
   * @param {Object} userData - Datos enviados al registrarse (email, name, password, etc.)
   * @returns {Object} Objeto listo para guardar en la base de datos.
   */
  static createFromData(userData) {
    return {
      email: userData.email,
      name: userData.name,
      password: userData.password,   // Nota: Aquí debería encriptarse antes de guardarse.
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * Método que devuelve un objeto con los datos del usuario 
   * que se pueden enviar como respuesta en la API.
   * 
   * Importante: No devuelve la contraseña (por seguridad).
   * 
   * @returns {Object} Datos del usuario listos para enviar al frontend.
   */
  toResponse() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Exportamos la clase para poder usarla en otros archivos.
module.exports = UserDTO;
