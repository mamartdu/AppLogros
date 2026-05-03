import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Category } from '../../models/category.model';
import { Level } from '../../models/level.model';
import { Achievement } from '../../models/achievement.model';
import { ModalCreateCategoryComponent } from '../../components/modal-create-category/modal-create-category.component';
import { ModalCreateAchievementFormComponent } from '../../components/modal-create-achievement-form/modal-create-achievement-form.component';

interface CategoryWithProgress extends Category {
  totalAchievements: number;
  completedAchievements: number;
  progressPercentage: number;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalCreateCategoryComponent, ModalCreateAchievementFormComponent],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  categories: CategoryWithProgress[] = [];
  levels: Level[] = [];
  isLoading: boolean = true;
  totalCompleted: number = 0;
  totalAchievements: number = 0;

  isModalCreateCategoryOpen: boolean = false;
  isModalCreateAchievementOpen: boolean = false;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const cats = await this.supabase.getCategories();
      this.levels = await this.supabase.getLevels();
      
      this.totalCompleted = 0;
      this.totalAchievements = 0;

      this.categories = await Promise.all(
        cats.map(async (cat) => {
          const achievements = await this.supabase.getAchievementsByCategory(cat.id);
          const completed = achievements.filter(a => a.is_completed).length;
          const total = achievements.length;
          
          this.totalAchievements += total;
          this.totalCompleted += completed;

          return {
            ...cat,
            totalAchievements: total,
            completedAchievements: completed,
            progressPercentage: total > 0 ? (completed / total) * 100 : 0
          };
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  openCreateCategoryModal() {
    this.isModalCreateCategoryOpen = true;
  }

  closeCreateCategoryModal() {
    this.isModalCreateCategoryOpen = false;
  }

  async onCategoryCreated(category: Category) {
    // Agregar la nueva categoría a la lista
    const newCategory: CategoryWithProgress = {
      ...category,
      totalAchievements: 0,
      completedAchievements: 0,
      progressPercentage: 0
    };
    this.categories.push(newCategory);
    this.closeCreateCategoryModal();
  }

  openCreateAchievementModal() {
    if (this.categories.length === 0) {
      alert('Debes crear al menos una categoría primero.');
      return;
    }
    this.isModalCreateAchievementOpen = true;
  }

  closeCreateAchievementModal() {
    this.isModalCreateAchievementOpen = false;
  }

  async onAchievementCreated(achievement: Achievement) {
    // Recargar datos para reflejar el nuevo logro
    await this.loadData();
    this.closeCreateAchievementModal();
  }
}

