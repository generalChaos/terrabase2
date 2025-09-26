import { supabase } from '@/lib/supabase';
import { logDebug, logError } from '@/lib/debug';

export abstract class BaseService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Generic method to find a record by ID
   */
  protected async findById(id: string, select = '*') {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(select)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to find ${this.tableName} with id ${id}: ${error.message}`);
      }

      return data;
    } catch (error) {
      await logError('system', 'database', `Error finding ${this.tableName} by id`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to find records with filters
   */
  protected async findMany(filters: Record<string, any> = {}, select = '*', orderBy?: string) {
    try {
      let query = supabase.from(this.tableName).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      await logError('system', 'database', `Error finding ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to create a record
   */
  protected async create(data: Record<string, any>) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
      }

      await logDebug('system', 'info', 'database', `Created ${this.tableName}`, { id: result.id });
      return result;
    } catch (error) {
      await logError('system', 'database', `Error creating ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to update a record
   */
  protected async update(id: string, data: Record<string, any>) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update ${this.tableName} with id ${id}: ${error.message}`);
      }

      await logDebug('system', 'info', 'database', `Updated ${this.tableName}`, { id });
      return result;
    } catch (error) {
      await logError('system', 'database', `Error updating ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to soft delete a record
   */
  protected async softDelete(id: string) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to soft delete ${this.tableName} with id ${id}: ${error.message}`);
      }

      await logDebug('system', 'info', 'database', `Soft deleted ${this.tableName}`, { id });
      return result;
    } catch (error) {
      await logError('system', 'database', `Error soft deleting ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to count records
   */
  public async count(filters: Record<string, any> = {}) {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      await logError('system', 'database', `Error counting ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Generic method to check if a record exists
   */
  protected async exists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}
