import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Category } from '../../models/category.model';

const MATERIAL_ICONS = [
  'explore', 'favorite', 'restaurant', 'spa', 'flight_takeoff',
  'school', 'sports_soccer', 'music_note', 'palette', 'camera',
  'book', 'local_movies', 'beach_access', 'directions_run', 'nightlife'
];

const COLORS = [
  '#ef4444', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#f97316', '#06b6d4', '#14b8a6', '#6366f1'
];

@Component({
  selector: 'app-modal-edit-category',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-edit-category.component.html',
  styleUrls: ['./modal-edit-category.component.css']
})
export class ModalEditCategoryComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() category: Category | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Category>();

  form: FormGroup;
  isLoading: boolean = false;
  selectedIcon: string = 'explore';
  selectedColor: string = '#ef4444';
  
  materialIcons = MATERIAL_ICONS;
  colors = COLORS;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    if (this.category) {
      this.form.patchValue({
        name: this.category.name
      });
      this.selectedIcon = this.category.icon;
      this.selectedColor = this.category.color;
    }
  }

  ngOnChanges() {
    if (this.category && this.isOpen) {
      this.form.patchValue({
        name: this.category.name
      });
      this.selectedIcon = this.category.icon;
      this.selectedColor = this.category.color;
    }
  }

  closeModal() {
    this.resetState();
    this.close.emit();
  }

  resetState() {
    this.form.reset();
    this.selectedIcon = 'explore';
    this.selectedColor = '#ef4444';
    this.isLoading = false;
  }

  selectIcon(icon: string) {
    this.selectedIcon = icon;
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  async submitForm() {
    if (!this.form.valid || !this.category) return;

    this.isLoading = true;
    try {
      const success = await this.supabase.updateCategory(
        this.category.id,
        this.form.value.name,
        this.selectedIcon,
        this.selectedColor
      );

      if (success) {
        const updatedCategory = {
          ...this.category,
          name: this.form.value.name,
          icon: this.selectedIcon,
          color: this.selectedColor
        };
        this.updated.emit(updatedCategory);
        this.closeModal();
      } else {
        alert('Hubo un error al actualizar la categoría.');
      }
    } finally {
      this.isLoading = false;
    }
  }
}
