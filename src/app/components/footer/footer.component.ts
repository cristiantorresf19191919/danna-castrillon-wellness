import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly phone = this.wellnessService.businessPhone;
  readonly currentYear = new Date().getFullYear();

  readonly footerNav = [
    { label: 'Inicio', href: '#' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Sobre mí', href: '#sobre-mi' },
    { label: 'Experiencia', href: '#experiencia' },
    { label: 'Diagnóstico interactivo', href: '#diagnostico-cuerpo' },
    { label: 'A domicilio', href: '#a-domicilio' },
    { label: 'Ubicación', href: '#ubicacion' },
    { label: 'Preguntas frecuentes', href: '#preguntas-frecuentes' },
    { label: 'Reservar cita', href: '#reservar' }
  ];

  getWhatsAppUrl(): string {
    return this.wellnessService.getWhatsAppUrl();
  }
}
