import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Achievement } from '../../models/achievement.model';

@Component({
  selector: 'app-modal-complete-achievement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-complete-achievement.component.html',
  styleUrls: ['./modal-complete-achievement.component.css']
})
export class ModalCompleteAchievementComponent {
  @Input() achievement: Achievement | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<Achievement>();

  constructor(private supabase: SupabaseService) {}

  closeModal() {
    this.close.emit();
  }

  async confirmCompletion() {
    if (!this.achievement) return;

    const success = await this.supabase.completeAchievement(this.achievement.id);
    if (success) {
      const updatedAchievement = { 
        ...this.achievement, 
        is_completed: true, 
        completed_at: new Date().toISOString()
      };
      this.completed.emit(updatedAchievement);
      this.closeModal();
    } else {
      alert('Hubo un error al guardar el logro.');
    }
  }
}
