import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { ServicesComponent } from './components/services/services.component';
import { BenefitsComponent } from './components/benefits/benefits.component';
import { AboutComponent } from './components/about/about.component';
import { InteractiveBodyComponent } from './components/interactive-body/interactive-body.component';
import { ProcessComponent } from './components/process/process.component';
import { HomeServiceComponent } from './components/home-service/home-service.component';
import { LocationComponent } from './components/location/location.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { FaqComponent } from './components/faq/faq.component';
import { SocialPillarsComponent } from './components/social-pillars/social-pillars.component';
import { BookingCTAComponent } from './components/booking-cta/booking-cta.component';
import { FooterComponent } from './components/footer/footer.component';
import { WhatsappFloatingButtonComponent } from './components/whatsapp-floating/whatsapp-floating.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    ServicesComponent,
    BenefitsComponent,
    AboutComponent,
    InteractiveBodyComponent,
    ProcessComponent,
    HomeServiceComponent,
    LocationComponent,
    TestimonialsComponent,
    FaqComponent,
    SocialPillarsComponent,
    BookingCTAComponent,
    FooterComponent,
    WhatsappFloatingButtonComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Danna Castrillón · Masaje Profesional & Terapia Física';
}
