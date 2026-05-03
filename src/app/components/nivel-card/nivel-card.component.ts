import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-nivel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nivel-card.component.html',
  styleUrls: ['./nivel-card.component.css']
})
export class NivelCardComponent {
  @Input() currentLevel!: Level;
  @Input() nextLevel: Level | null = null;
  @Input() points!: number;
  @Input() progress!: number;
}
