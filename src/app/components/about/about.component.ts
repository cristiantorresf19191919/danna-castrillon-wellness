import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly credentials = [
    { title: 'Terapia física & Movilidad', desc: 'Enfoque biomecánico y funcional' },
    { title: 'Técnicas manuales avanzadas', desc: 'Liberación miofascial y puntos gatillo' },
    { title: 'Atención personalizada', desc: 'Consultorio en Park Way y a domicilio' },
    { title: 'Protocolos de bioseguridad', desc: 'Materiales e insumos 100% higienizados' }
  ];

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl('Hola Danna 👋 Leí sobre ti en tu página y quisiera agendar una valoración.');
  }
}
