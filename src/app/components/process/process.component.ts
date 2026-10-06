import { Component, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
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

  ngAfterViewInit(): void {
    const host = this.hostRef.nativeElement;

    // 1. IntersectionObserver to highlight each step node & card as the user scrolls
    if (typeof IntersectionObserver !== 'undefined') {
      const rows = host.querySelectorAll('.timeline-step-row');
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('step-active');
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
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
              start: 'top 70%',
              end: 'bottom 75%',
              scrub: 0.4
            }
          });
        }
      }, host);

      // Refresh ScrollTrigger once everything is mounted
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
