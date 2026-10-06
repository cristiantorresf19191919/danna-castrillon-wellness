import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BodyCanvas3dComponent } from './body-canvas-3d/body-canvas-3d.component';
import { WellnessService } from '../../core/services/wellness.service';
import { BodyZone } from '../../core/models/wellness.model';

@Component({
  selector: 'app-interactive-body',
  standalone: true,
  imports: [CommonModule, IconComponent, BodyCanvas3dComponent],
  templateUrl: './interactive-body.component.html',
  styleUrl: './interactive-body.component.scss'
})
export class InteractiveBodyComponent {
  @ViewChild(BodyCanvas3dComponent) bodyCanvas3d?: BodyCanvas3dComponent;

  private readonly wellnessService = inject(WellnessService);

  readonly zones = this.wellnessService.bodyZones;
  readonly activeZone = this.wellnessService.activeBodyZone;
  readonly viewMode = signal<'front' | 'back'>('back');
  readonly displayMode = signal<'3d' | '2d'>('3d');

  selectZone(zoneId: string): void {
    this.wellnessService.selectBodyZone(zoneId);
    this.bodyCanvas3d?.updateActiveHotspotVisuals(zoneId);
  }

  setDisplayMode(mode: '3d' | '2d'): void {
    this.displayMode.set(mode);
  }

  setViewMode(mode: 'front' | 'back'): void {
    this.viewMode.set(mode);
    this.bodyCanvas3d?.rotateTo(mode);

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
