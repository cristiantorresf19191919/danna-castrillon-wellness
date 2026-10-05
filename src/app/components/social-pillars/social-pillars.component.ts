import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

@Component({
  selector: 'app-social-pillars',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './social-pillars.component.html',
  styleUrl: './social-pillars.component.scss'
})
export class SocialPillarsComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly posts = this.wellnessService.socialPosts;

  readonly instagramHandle = '@dannacastrillon.bienestar';
  readonly instagramUrl = 'https://instagram.com/';
}
