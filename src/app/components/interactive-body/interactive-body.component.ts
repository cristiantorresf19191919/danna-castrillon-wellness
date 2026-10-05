import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';
import { BodyZone } from '../../core/models/wellness.model';

@Component({
  selector: 'app-interactive-body',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './interactive-body.component.html',
  styleUrl: './interactive-body.component.scss'
})
export class InteractiveBodyComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly zones = this.wellnessService.bodyZones;
  readonly activeZone = this.wellnessService.activeBodyZone;
  readonly viewMode = signal<'front' | 'back'>('back');

  selectZone(zoneId: string): void {
    this.wellnessService.selectBodyZone(zoneId);
  }

  setViewMode(mode: 'front' | 'back'): void {
    this.viewMode.set(mode);
    if (mode === 'front' && (this.activeZone().id === 'espalda-alta' || this.activeZone().id === 'espalda-baja')) {
      this.wellnessService.selectBodyZone('cuello');
    } else if (mode === 'back' && (this.activeZone().id === 'brazos-manos')) {
      this.wellnessService.selectBodyZone('espalda-alta');
    }
  }

  getWhatsAppBookingUrl(zone: BodyZone): string {
    return this.wellnessService.getWhatsAppUrl(zone.whatsappMsg);
  }
}
