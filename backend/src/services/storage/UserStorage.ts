import { InMemoryStorage } from './InMemoryStorage';
import { User } from '../../types';

export class UserStorage extends InMemoryStorage<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async updatePreferences(userId: string, preferences: User['preferences']): Promise<User | null> {
    return this.update(userId, { preferences });
  }
}

export const userStorage = new UserStorage();