import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss'
})
export class LocationComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly mapsDirectionsUrl = 'https://www.google.com/maps/search/?api=1&query=Park+Way+La+Soledad+Teusaquillo+Bogota';

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl('Hola Danna 👋 Quisiera conocer la disponibilidad para una sesión en tu consultorio de La Soledad (Park Way).');
  }
}
