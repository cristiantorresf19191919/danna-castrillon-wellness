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

  exploreIn3D(service: ServiceItem): void {
    if (service.id === 'drenaje-linfatico') {
      this.wellnessService.selectMassageLayer('linfatico');
      this.wellnessService.selectBodyZone('piernas');
      this.wellnessService.selectTensionLevel('leve');
    } else if (service.id === 'masaje-relajante') {
      this.wellnessService.selectMassageLayer('relajacion');
      this.wellnessService.selectBodyZone('cuello');
      this.wellnessService.selectTensionLevel('leve');
    } else if (service.id === 'terapia-fisica') {
      this.wellnessService.selectMassageLayer('muscular');
      this.wellnessService.selectBodyZone('espalda-baja');
      this.wellnessService.selectTensionLevel('severa');
    } else {
      this.wellnessService.selectMassageLayer('muscular');
      this.wellnessService.selectBodyZone('hombros');
      this.wellnessService.selectTensionLevel('moderada');
    }

    if (typeof document !== 'undefined') {
      const element = document.getElementById('diagnostico-cuerpo');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
