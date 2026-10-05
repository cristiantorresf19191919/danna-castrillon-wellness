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

  readonly steps = this.wellnessService.processSteps;

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.ctx = gsap.context(() => {
      // Animate progress line with scroll
      gsap.to('.timeline-progress-bar', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.timeline-container',
          start: 'top 70%',
          end: 'bottom 80%',
          scrub: 0.5
        }
      });

      // Stagger steps entrance
      gsap.from('.timeline-step-card', {
        y: 35,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.timeline-container',
          start: 'top 75%'
        }
      });
    }, this.hostRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
