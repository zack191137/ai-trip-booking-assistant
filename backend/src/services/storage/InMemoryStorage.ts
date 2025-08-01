import { v4 as uuidv4 } from 'uuid';
import { BaseStorage } from './BaseStorage';

export class InMemoryStorage<T extends { id: string; createdAt: Date; updatedAt: Date }> implements BaseStorage<T> {
  private data: Map<string, T> = new Map();

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = uuidv4();
    const now = new Date();
    
    const item = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    this.data.set(id, item);
    return item;
  }

  async findById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    const items = Array.from(this.data.values());
    
    if (!filter) {
      return items;
    }

    return items.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true;
        return (item as any)[key] === value;
      });
    });
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = this.data.get(id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      id, // Ensure ID cannot be changed
      createdAt: existing.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date(),
    } as T;

    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  // Additional utility methods for in-memory storage
  async count(filter?: Partial<T>): Promise<number> {
    if (!filter) {
      return this.data.size;
    }
    
    const items = await this.findAll(filter);
    return items.length;
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const items = await this.findAll(filter);
    return items[0] || null;
  }

  async exists(id: string): Promise<boolean> {
    return this.data.has(id);
  }
}