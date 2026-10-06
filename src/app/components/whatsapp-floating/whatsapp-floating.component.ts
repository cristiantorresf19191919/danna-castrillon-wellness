import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-whatsapp-floating',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './whatsapp-floating.component.html',
  styleUrl: './whatsapp-floating.component.scss'
})
export class WhatsappFloatingButtonComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly isScrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 280);
    }
  }

  getWhatsAppUrl(): string {
    return this.wellnessService.getWhatsAppUrl();
  }
}
