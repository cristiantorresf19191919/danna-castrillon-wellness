import { Component, ElementRef, AfterViewInit, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';
import gsap from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private readonly wellnessService = inject(WellnessService);
  private readonly hostRef = inject(ElementRef);
  private ctx?: gsap.Context;

  readonly heroContainer = viewChild<ElementRef>('heroSection');
  readonly imageWrapper = viewChild<ElementRef>('imageWrapper');
  readonly floatingCard = viewChild<ElementRef>('floatingCard');

  // Mouse tilt signal for interactive parallax on portrait card
  readonly mouseX = signal(0);
  readonly mouseY = signal(0);

  getWhatsAppBookingUrl(): string {
    return this.wellnessService.getWhatsAppUrl();
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.hostRef.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    this.mouseX.set(x * 15);
    this.mouseY.set(y * 15);
  }

  ngAfterViewInit(): void {
    // Respect user's motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });

      // Staggered subtle reveal for words
      tl.from('.hero-word', {
        y: 18,
        opacity: 0,
        stagger: 0.04,
        duration: 0.5,
        clearProps: 'all'
      });

      // Subtle image entrance
      gsap.from('.hero-portrait-frame', {
        scale: 0.96,
        opacity: 0.8,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });

      // Floating card gentle float in
      gsap.from('.hero-floating-card', {
        y: 15,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });

      // Status pill gentle entrance
      gsap.from('.hero-status-pill', {
        y: -10,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });

      // Subtle slow floating loop for background botanical blobs
      gsap.to('.hero-blob-1', {
        y: -18,
        x: 12,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.hero-blob-2', {
        y: 15,
        x: -10,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, this.hostRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
