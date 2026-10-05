import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly testimonials = this.wellnessService.testimonials;

  readonly currentIndex = signal(0);

  next(): void {
    const total = this.testimonials().length;
    this.currentIndex.update(i => (i + 1) % total);
  }

  prev(): void {
    const total = this.testimonials().length;
    this.currentIndex.update(i => (i - 1 + total) % total);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }
}
