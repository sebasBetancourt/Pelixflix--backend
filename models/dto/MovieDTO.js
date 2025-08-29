// dtos/UserDTO.js
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

class MovieDTO {
  constructor(movie) {
    this.id = user._id ? user._id.toString() : null;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role || 'user';
    this.phone = user.phone || null;
    this.country = user.country || null;
    this.avatarUrl = user.avatarUrl || null;
    this.createdAt = user.createdAt;
    this.banned = user.banned ?? false;
    this.preferences = user.preferences || {
      marketingEmails: false,
      personalizedRecs: true,
      shareAnonymized: false,
      dataRetentionMonths: null
    };
    this.lists = user.lists || [];
  }

  static async createFromData(userData) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const now = new Date();

    return {
      _id: new ObjectId(),
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role || 'user',
      name: userData.name || '',
      phone: userData.phone || null,
      country: userData.country || null,
      avatarUrl: userData.avatarUrl || null,
      createdAt: now,
      banned: false,
      preferences: {
        marketingEmails: false,
        personalizedRecs: true,
        shareAnonymized: false
      },
      lists: []
    };
  }

  toResponse() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      phone: this.phone,
      country: this.country,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      banned: this.banned,
      preferences: this.preferences,
      lists: this.lists
    };
  }
}

export default MovieDTO;