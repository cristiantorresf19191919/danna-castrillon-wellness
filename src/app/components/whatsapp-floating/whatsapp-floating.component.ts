import { Component, inject } from '@angular/core';
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

  getWhatsAppUrl(): string {
    return this.wellnessService.getWhatsAppUrl();
  }
}
