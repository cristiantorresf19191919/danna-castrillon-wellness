import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-home-service',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './home-service.component.html',
  styleUrl: './home-service.component.scss'
})
export class HomeServiceComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly homeFeatures = [
    {
      title: 'Camilla profesional portátil',
      desc: 'Estructura robusta, acolchado de memoria y soporte ergonómico para cabeza y brazos.'
    },
    {
      title: 'Higiene & bioseguridad 100%',
      desc: 'Sábanas térmicas desechables de un solo uso, toallas esterilizadas y sanitización continua.'
    },
    {
      title: 'Atmósfera spa completa',
      desc: 'Llevamos aromaterapia con difusor ultrasónico, aceites orgánicos y música binaural relajante.'
    },
    {
      title: 'Cero trancones en Bogotá',
      desc: 'Terminas tu sesión y pasas directo a tu cama o ducha, sin exponerte al tráfico de la ciudad.'
    }
  ];

  readonly coverageZones = [
    'Teusaquillo & Park Way',
    'Chapinero & Zona G',
    'Salitre & Ciudad Salitre',
    'Chicó & Rosales',
    'Usaquén & Santa Bárbara',
    'Cedritos & Colina Campestre'
  ];

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl('Hola Danna 👋 Me gustaría consultar disponibilidad y tarifas para una sesión a domicilio en Bogotá.');
  }
}
