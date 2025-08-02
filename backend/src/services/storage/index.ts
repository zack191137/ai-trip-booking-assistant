// Export all storage services
export { BaseStorage } from './BaseStorage';
export { InMemoryStorage } from './InMemoryStorage';
export { UserStorage, userStorage } from './UserStorage';
export { ConversationStorage, conversationStorage } from './ConversationStorage';
export { TripStorage, tripStorage } from './TripStorage';

// Import storage instances for the manager
import { userStorage } from './UserStorage';
import { conversationStorage } from './ConversationStorage';
import { tripStorage } from './TripStorage';

// Storage manager for centralized access
export class StorageManager {
  public users = userStorage;
  public conversations = conversationStorage;
  public trips = tripStorage;

  // Clear all data - useful for testing or reset
  async clearAll(): Promise<void> {
    await Promise.all([
      this.users.clear(),
      this.conversations.clear(),
      this.trips.clear(),
    ]);
  }

  // Get storage statistics
  async getStats(): Promise<{
    users: number;
    conversations: number;
    trips: number;
    total: number;
  }> {
    const [userCount, conversationCount, tripCount] = await Promise.all([
      this.users.count(),
      this.conversations.count(),
      this.trips.count(),
    ]);

    return {
      users: userCount,
      conversations: conversationCount,
      trips: tripCount,
      total: userCount + conversationCount + tripCount,
    };
  }
}

export const storage = new StorageManager();

/* 
 * NOTE: This is an in-memory storage implementation for P0 POC.
 * In P1, this will be replaced with proper database implementations
 * using PostgreSQL with Sequelize/Prisma.
 * 
 * The interface design allows for easy migration to database storage
 * without changing the business logic.
 */