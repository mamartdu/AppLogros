import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model';
import { Level } from '../models/level.model';
import { Achievement } from '../models/achievement.model';
import { GlobalStats } from '../models/global-stats.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getGlobalStats(): Promise<GlobalStats | null> {
    const { data, error } = await this.supabase
      .from('global_stats')
      .select('*')
      .limit(1)
      .single();
    if (error) {
      console.error('Error fetching global stats', error);
      return null;
    }
    return data;
  }

  async getLevels(): Promise<Level[]> {
    const { data, error } = await this.supabase
      .from('levels')
      .select('*')
      .order('points', { ascending: true });
    if (error) {
      console.error('Error fetching levels', error);
      return [];
    }
    return data || [];
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching categories', error);
      return [];
    }
    return data || [];
  }

  async getAchievementsByCategory(categoryId: string): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('category_id', categoryId)
      .order('title', { ascending: true });
    if (error) {
      console.error('Error fetching achievements', error);
      return [];
    }
    return data || [];
  }

  async uploadAchievementImage(file: Blob, achievementId: string): Promise<string | null> {
    const fileName = `${achievementId}_${new Date().getTime()}.jpg`;
    const { data, error } = await this.supabase.storage
      .from('logros-fotos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image', error);
      return null;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('logros-fotos')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async completeAchievement(achievementId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('achievements')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', achievementId);

    if (error) {
      console.error('Error completing achievement', error);
      return false;
    }

    return true;
  }

  async uncompleteAchievement(achievementId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('achievements')
      .update({
        is_completed: false,
        completed_at: null
      })
      .eq('id', achievementId);

    if (error) {
      console.error('Error uncompleting achievement', error);
      return false;
    }

    return true;
  }

  async createCategory(name: string, icon: string, color: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert([{
        name,
        icon,
        color,
        completed_count: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category', error);
      return null;
    }

    return data;
  }

  async updateCategory(id: string, name: string, icon: string, color: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('categories')
      .update({
        name,
        icon,
        color
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating category', error);
      return false;
    }

    return true;
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category', error);
      return false;
    }

    return true;
  }

  async createAchievement(
    categoryId: string,
    levelId: string,
    title: string,
    description: string,
    photoUrl?: string
  ): Promise<Achievement | null> {
    const { data, error } = await this.supabase
      .from('achievements')
      .insert([{
        category_id: categoryId,
        level_id: levelId,
        title,
        description,
        is_completed: false,
        photo_url: photoUrl || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement', error);
      return null;
    }

    return data;
  }

  async updateAchievement(
    id: string,
    title?: string,
    description?: string,
    levelId?: string,
    photoUrl?: string,
  ): Promise<boolean> {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (levelId !== undefined) updateData.level_id = levelId;
    if (photoUrl !== undefined) updateData.photo_url = photoUrl;

    const { error } = await this.supabase
      .from('achievements')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating achievement', error);
      return false;
    }

    return true;
  }

  async deleteAchievement(achievementId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId);

    if (error) {
      console.error('Error deleting achievement', error);
      return false;
    }

    return true;
  }

  /**
   * Calcula el nivel actual basado en los puntos totales
   */
  calculateCurrentLevel(totalPoints: number, levels: Level[]): Level {
    let current = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].points) {
        current = levels[i];
        break;
      }
    }
    return current;
  }

  /**
   * Obtiene información de progreso hacia el siguiente nivel
   */
  getProgressToNextLevel(totalPoints: number, levels: Level[]): {
    current: Level;
    next: Level | null;
    currentPoints: number;
    pointsForNext: number;
    percentage: number;
  } {
    const current = this.calculateCurrentLevel(totalPoints, levels);
    const currentIndex = levels.findIndex(l => l.id === current.id);
    const next = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    const currentPoints = totalPoints - current.points;
    const pointsForNext = next ? next.points - current.points : 0;
    const percentage = pointsForNext > 0 ? (currentPoints / pointsForNext) * 100 : 100;

    return {
      current,
      next,
      currentPoints: Math.max(0, currentPoints),
      pointsForNext: Math.max(0, pointsForNext),
      percentage: Math.min(100, Math.max(0, percentage))
    };
  }
}
