import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly wellnessService = inject(WellnessService);
  readonly themeService = inject(ThemeService);

  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);

  readonly navLinks = [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Sobre mí', href: '#sobre-mi' },
    { label: 'Experiencia', href: '#experiencia' },
    { label: 'Diagnóstico', href: '#diagnostico-cuerpo' },
    { label: 'A Domicilio', href: '#a-domicilio' },
    { label: 'Ubicación', href: '#ubicacion' },
    { label: 'FAQ', href: '#preguntas-frecuentes' }
  ];

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.isScrolled.set(scrollY > 50);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
    if (this.isMobileMenuOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    document.body.style.overflow = '';
  }

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl();
  }
}
