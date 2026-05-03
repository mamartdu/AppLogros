import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { SupabaseService } from '../../services/supabase.service';
import { Achievement } from '../../models/achievement.model';
import { Category } from '../../models/category.model';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-modal-create-achievement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageCropperComponent],
  templateUrl: './modal-create-achievement-form.component.html',
  styleUrls: ['./modal-create-achievement-form.component.css']
})
export class ModalCreateAchievementFormComponent {
  @Input() isOpen: boolean = false;
  @Input() categories: Category[] = [];
  @Input() levels: Level[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Achievement>();

  form: FormGroup;
  isLoading: boolean = false;
  isUploading: boolean = false;

  // Photo cropping
  imageChangedEvent: any = '';
  croppedImageBlob: Blob | null = null;
  croppedImageUrl: string = '';
  showPhotoStep: boolean = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      categoryId: ['', Validators.required],
      levelId: ['', Validators.required]
    });
  }

  closeModal() {
    this.resetState();
    this.close.emit();
  }

  resetState() {
    this.form.reset();
    this.imageChangedEvent = '';
    this.croppedImageBlob = null;
    this.croppedImageUrl = '';
    this.showPhotoStep = false;
    this.isLoading = false;
    this.isUploading = false;
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl) {
      this.croppedImageUrl = event.objectUrl;
    }
    if (event.blob) {
      this.croppedImageBlob = event.blob;
    }
  }

  resetPhoto() {
    this.imageChangedEvent = '';
    this.croppedImageBlob = null;
    this.croppedImageUrl = '';
  }

  skipPhotoStep() {
    this.submitForm();
  }

  async submitForm() {
    if (!this.form.valid) return;

    this.isLoading = true;
    try {
      let photoUrl = null;

      // Si hay foto cropped, subirla
      if (this.croppedImageBlob && this.form.value.title) {
        this.isUploading = true;
        photoUrl = await this.supabase.uploadAchievementImage(
          this.croppedImageBlob,
          `${this.form.value.categoryId}_${Date.now()}`
        );
        this.isUploading = false;

        if (!photoUrl) {
          alert('Hubo un error al subir la foto.');
          this.isLoading = false;
          return;
        }
      }

      const achievement = await this.supabase.createAchievement(
        this.form.value.categoryId,
        this.form.value.levelId,
        this.form.value.title,
        this.form.value.description,
        photoUrl || undefined
      );

      if (achievement) {
        this.created.emit(achievement);
        this.closeModal();
      } else {
        alert('Hubo un error al crear el logro.');
      }
    } finally {
      this.isLoading = false;
    }
  }
}
