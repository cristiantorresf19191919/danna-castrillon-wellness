import { Component, ElementRef, AfterViewInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './process.component.html',
  styleUrl: './process.component.scss'
})
export class ProcessComponent implements AfterViewInit, OnDestroy {
  private readonly wellnessService = inject(WellnessService);
  private readonly hostRef = inject(ElementRef);
  private ctx?: gsap.Context;
  private observer?: IntersectionObserver;

  readonly steps = this.wellnessService.processSteps;
  readonly activeStepIndex = signal<number>(0);

  readonly progressPercent = computed(() => {
    const idx = this.activeStepIndex();
    const total = this.steps().length;
    if (total <= 1) return 100;
    return Math.min(100, Math.max(12, Math.round(((idx + 0.5) / total) * 100)));
  });

  getShortStepName(number: string): string {
    switch (number) {
      case '01': return 'Valoración';
      case '02': return 'Diagnóstico';
      case '03': return 'Tratamiento';
      case '04': return 'Autocuidado';
      default: return `Paso ${number}`;
    }
  }

  scrollToStep(index: number): void {
    if (index < 0 || index >= this.steps().length) return;
    this.activeStepIndex.set(index);
    const rows = this.hostRef.nativeElement.querySelectorAll('.timeline-step-row');
    if (rows[index]) {
      const headerOffset = 110;
      const elementPosition = rows[index].getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  getWhatsAppUrl(): string {
    return this.wellnessService.getWhatsAppUrl(
      'Hola Danna 👋 Revisé tu proceso de atención paso a paso en la web y quisiera agendar una sesión personalizada.'
    );
  }

  ngAfterViewInit(): void {
    const host = this.hostRef.nativeElement;

    // 1. IntersectionObserver to track and highlight each step node & card as the user scrolls
    if (typeof IntersectionObserver !== 'undefined') {
      const rows = host.querySelectorAll('.timeline-step-row');
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute('data-step-index');
            if (idxAttr !== null) {
              const idx = Number(idxAttr);
              this.activeStepIndex.set(idx);
            }
          }
        });
      }, {
        threshold: 0.25,
        rootMargin: '-80px 0px -30% 0px'
      });

      rows.forEach((row: Element) => this.observer?.observe(row));
    }

    // 2. Animate vertical progress bar line with GSAP ScrollTrigger
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.ctx = gsap.context(() => {
        const container = host.querySelector('.timeline-container');
        const progressBar = host.querySelector('.timeline-progress-bar');
        
        if (container && progressBar) {
          gsap.to(progressBar, {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top 65%',
              end: 'bottom 80%',
              scrub: 0.3
            }
          });
        }
      }, host);

      setTimeout(() => ScrollTrigger.refresh(), 200);
      if (typeof window !== 'undefined') {
        window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      }
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
