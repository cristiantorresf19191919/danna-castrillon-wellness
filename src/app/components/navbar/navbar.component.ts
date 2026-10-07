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
  readonly isHidden = signal(false);
  readonly isMobileMenuOpen = signal(false);

  private lastScrollY = 0;
  private readonly scrollThreshold = 8;

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
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;

    // Toggle scrolled styling
    this.isScrolled.set(currentScrollY > 30);

    // If mobile menu is open, never hide
    if (this.isMobileMenuOpen()) {
      this.isHidden.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    const diff = currentScrollY - this.lastScrollY;

    // Scrolling DOWN past 80px -> hide header to free up full mobile screen
    if (diff > this.scrollThreshold && currentScrollY > 80) {
      this.isHidden.set(true);
    }
    // Scrolling UP or at top -> show header immediately
    else if (diff < -this.scrollThreshold || currentScrollY <= 30) {
      this.isHidden.set(false);
    }

    this.lastScrollY = Math.max(0, currentScrollY);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
    if (this.isMobileMenuOpen()) {
      this.isHidden.set(false);
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
