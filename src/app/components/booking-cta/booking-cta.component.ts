import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-booking-cta',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './booking-cta.component.html',
  styleUrl: './booking-cta.component.scss'
})
export class BookingCTAComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly phone = this.wellnessService.businessPhone;
  readonly selectedService = signal<string>('Masaje Relajante');
  readonly selectedLocation = signal<string>('Consultorio (La Soledad / Park Way)');

  readonly serviceOptions = [
    'Masaje Relajante',
    'Masaje Descontracturante',
    'Terapia Física',
    'Corrección Postural',
    'Atención Personalizada'
  ];

  readonly locationOptions = [
    'Consultorio (La Soledad / Park Way)',
    'A domicilio en Bogotá'
  ];

  selectService(service: string): void {
    this.selectedService.set(service);
  }

  selectLocation(location: string): void {
    this.selectedLocation.set(location);
  }

  generateCustomWhatsAppUrl(): string {
    const msg = `Hola Danna 👋 Vi tu página web. Quisiera agendar una sesión de *${this.selectedService()}* para realizar en *${this.selectedLocation()}*. ¿Qué horarios tienes disponibles?`;
    return this.wellnessService.getWhatsAppUrl(msg);
  }
}
