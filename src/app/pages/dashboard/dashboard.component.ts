import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { GlobalStats } from '../../models/global-stats.model';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: GlobalStats | null = null;
  currentLevel: Level | null = null;
  nextLevel: Level | null = null;
  currentPoints: number = 0;
  pointsForNext: number = 0;
  progressPercentage: number = 0;
  isLoading: boolean = true;
  lastActivityDate: string | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    this.isLoading = true;
    try {
      this.stats = await this.supabase.getGlobalStats();
      const levels = await this.supabase.getLevels();
      
      if (this.stats && levels.length > 0) {
        const progress = this.supabase.getProgressToNextLevel(
          this.stats.total_points,
          levels
        );
        
        this.currentLevel = progress.current;
        this.nextLevel = progress.next;
        this.currentPoints = progress.currentPoints;
        this.pointsForNext = progress.pointsForNext;
        this.progressPercentage = progress.percentage;
        this.lastActivityDate = this.stats.last_activity_date;
      }
    } finally {
      this.isLoading = false;
    }
  }

  formatDate(date: string | null): string {
    if (!date) return 'Sin actividad aún';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
