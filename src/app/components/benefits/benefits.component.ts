import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './benefits.component.html',
  styleUrl: './benefits.component.scss'
})
export class BenefitsComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly benefits = this.wellnessService.benefits;
}
