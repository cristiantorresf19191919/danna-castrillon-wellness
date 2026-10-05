import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly faqs = this.wellnessService.faqs;

  // Track open state for each item (by default, first item is open)
  readonly openFaqId = signal<string>('faq-1');

  toggleFaq(id: string): void {
    if (this.openFaqId() === id) {
      this.openFaqId.set('');
    } else {
      this.openFaqId.set(id);
    }
  }

  isOpen(id: string): boolean {
    return this.openFaqId() === id;
  }

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl('Hola Danna 👋 Tengo una consulta adicional sobre tus servicios.');
  }
}
