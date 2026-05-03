import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { SupabaseService } from '../../services/supabase.service';
import { Achievement } from '../../models/achievement.model';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-modal-edit-achievement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageCropperComponent],
  templateUrl: './modal-edit-achievement-form.component.html',
  styleUrls: ['./modal-edit-achievement-form.component.css']
})
export class ModalEditAchievementFormComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() achievement: Achievement | null = null;
  @Input() levels: Level[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Achievement>();

  form: FormGroup;
  isLoading: boolean = false;
  isUploading: boolean = false;

  // Variables para la imagen y el cropper
  currentImageUrl: string | null = null;
  imageChangedEvent: any = '';
  croppedImageBlob: Blob | null = null;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      levelId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.patchFormValues();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.patchFormValues();
    }
  }

  patchFormValues() {
    if (this.achievement) {
      this.form.patchValue({
        title: this.achievement.title,
        description: this.achievement.description,
        levelId: this.achievement.level_id
      });
      // Guardar la URL actual para mostrarla si no se ha seleccionado una nueva
      this.currentImageUrl = this.achievement.photo_url || null;
    }
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.croppedImageBlob = event.blob;
    }
  }

  resetPhoto() {
    this.imageChangedEvent = '';
    this.croppedImageBlob = null;
  }

  closeModal() {
    this.resetState();
    this.close.emit();
  }

  resetState() {
    this.form.reset();
    this.isLoading = false;
    this.isUploading = false;
    this.imageChangedEvent = '';
    this.croppedImageBlob = null;
    this.currentImageUrl = null;
  }

  async submitForm() {
    if (!this.form.valid || !this.achievement) return;

    this.isLoading = true;
    try {
      let finalPhotoUrl = this.achievement.photo_url;

      // Si hay una foto recortada nueva, la subimos
      if (this.croppedImageBlob) {
        this.isUploading = true;
        const uploadedUrl = await this.supabase.uploadAchievementImage(
          this.croppedImageBlob, 
          this.achievement.id
        );
        this.isUploading = false;

        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        } else {
          alert('Error al subir la nueva imagen.');
          this.isLoading = false;
          return;
        }
      }

      // Actualizamos los datos
      const success = await this.supabase.updateAchievement(
        this.achievement.id,
        this.form.value.title,
        this.form.value.description,
        this.form.value.levelId,
        finalPhotoUrl || undefined
      );

      if (success) {
        const updatedAchievement = {
          ...this.achievement,
          title: this.form.value.title,
          description: this.form.value.description,
          level_id: this.form.value.levelId,
          photo_url: finalPhotoUrl
        };
        this.updated.emit(updatedAchievement);
        this.closeModal();
      } else {
        alert('Hubo un error al actualizar el logro.');
      }
    } finally {
      this.isLoading = false;
      this.isUploading = false;
    }
  }
}