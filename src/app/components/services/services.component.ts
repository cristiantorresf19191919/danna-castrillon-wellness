import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';
import { ServiceItem } from '../../core/models/wellness.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly services = this.wellnessService.services;

  getWhatsAppBookingUrl(service: ServiceItem): string {
    return this.wellnessService.getWhatsAppUrl(service.whatsappMsg);
  }
}
