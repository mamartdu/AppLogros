import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Achievement } from '../../models/achievement.model';
import { Category } from '../../models/category.model';
import { Level } from '../../models/level.model';
import { ModalCompleteAchievementComponent } from '../../components/modal-complete-achievement/modal-complete-achievement.component';
import { ModalEditAchievementFormComponent } from '../../components/modal-edit-achievement-form/modal-edit-achievement-form.component';
import { ModalEditCategoryComponent } from '../../components/modal-edit-category/modal-edit-category.component';

@Component({
  selector: 'app-categoria-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalCompleteAchievementComponent, ModalEditAchievementFormComponent, ModalEditCategoryComponent],
  templateUrl: './categoria-detail.component.html',
  styleUrls: ['./categoria-detail.component.css']
})
export class CategoriaDetailComponent implements OnInit {
  category: Category | null = null;
  achievements: Achievement[] = [];
  levels: Level[] = [];
  pendingAchievements: Achievement[] = [];
  completedAchievements: Achievement[] = [];
  
  activeTab: 'pending' | 'completed' | 'all' = 'pending';
  isLoading: boolean = true;
  categoryId: string | null = null;

  // Modals
  isModalOpen: boolean = false;
  selectedAchievement: Achievement | null = null;

  isEditAchievementModalOpen: boolean = false;
  selectedAchievementToEdit: Achievement | null = null;

  isEditCategoryModalOpen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService
  ) {}

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading = true;
    try {
      if (this.categoryId) {
        // Cargar categoría, logros y niveles
        const cats = await this.supabase.getCategories();
        this.category = cats.find(c => c.id === this.categoryId) || null;
        
        this.achievements = await this.supabase.getAchievementsByCategory(this.categoryId);
        this.levels = await this.supabase.getLevels();
        
        this.filterAchievements();
      }
    } finally {
      this.isLoading = false;
    }
  }

  filterAchievements() {
    this.pendingAchievements = this.achievements.filter(a => !a.is_completed);
    this.completedAchievements = this.achievements.filter(a => a.is_completed);
  }

  setTab(tab: 'pending' | 'completed' | 'all') {
    this.activeTab = tab;
  }

  getLevelForAchievement(achievement: Achievement): Level | undefined {
    return this.levels.find(l => l.id === achievement.level_id);
  }

  getDisplayAchievements(): Achievement[] {
    switch (this.activeTab) {
      case 'pending':
        return this.pendingAchievements;
      case 'completed':
        return this.completedAchievements;
      case 'all':
      default:
        return this.achievements;
    }
  }

  openCompletionModal(achievement: Achievement) {
    this.selectedAchievement = achievement;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedAchievement = null;
  }

  onAchievementCompleted(updatedAchievement: Achievement) {
    const index = this.achievements.findIndex(a => a.id === updatedAchievement.id);
    if (index !== -1) {
      this.achievements[index] = updatedAchievement;
      this.filterAchievements();
      this.activeTab = 'completed';
    }
  }

  openEditAchievementModal(achievement: Achievement) {
    this.selectedAchievementToEdit = achievement;
    this.isEditAchievementModalOpen = true;
  }

  closeEditAchievementModal() {
    this.isEditAchievementModalOpen = false;
    this.selectedAchievementToEdit = null;
  }

  onAchievementUpdated(updatedAchievement: Achievement) {
    const index = this.achievements.findIndex(a => a.id === updatedAchievement.id);
    if (index !== -1) {
      this.achievements[index] = updatedAchievement;
      this.filterAchievements();
    }
  }

  openEditCategoryModal() {
    this.isEditCategoryModalOpen = true;
  }

  closeEditCategoryModal() {
    this.isEditCategoryModalOpen = false;
  }

  onCategoryUpdated(updatedCategory: Category) {
    this.category = updatedCategory;
  }

  async uncompleteAchievement(achievement: Achievement) {
    const confirmed = confirm(`¿Desmarcar "${achievement.title}" como completado?`);
    if (!confirmed) return;

    const success = await this.supabase.uncompleteAchievement(achievement.id);
    if (success) {
      const index = this.achievements.findIndex(a => a.id === achievement.id);
      if (index !== -1) {
        this.achievements[index] = {
          ...achievement,
          is_completed: false,
          completed_at: null
        };
        this.filterAchievements();
        this.activeTab = 'pending';
      }
    } else {
      alert('Hubo un error al desmarcar el logro.');
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
