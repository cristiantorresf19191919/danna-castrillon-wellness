import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WellnessService } from '../../core/services/wellness.service';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  hasSlots: boolean;
}

@Component({
  selector: 'app-booking-cta',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './booking-cta.component.html',
  styleUrl: './booking-cta.component.scss'
})
export class BookingCTAComponent {
  private readonly wellnessService = inject(WellnessService);

  readonly phone = this.wellnessService.businessPhone;
  readonly selectedService = signal<string>('Masaje Relajante');
  readonly selectedLocation = signal<string>('Consultorio (La Soledad / Park Way)');

  readonly serviceOptions = [
    'Masaje Relajante',
    'Masaje Descontracturante',
    'Terapia Física',
    'Corrección Postural',
    'Atención Personalizada'
  ];

  readonly locationOptions = [
    'Consultorio (La Soledad / Park Way)',
    'A domicilio en Bogotá'
  ];

  // Calendar State
  private readonly today = new Date();
  readonly viewDate = signal<Date>(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedDate = signal<Date>(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate()));
  readonly selectedTimeSlot = signal<string>('10:00 AM');

  readonly weekDayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  readonly currentMonthLabel = computed(() => {
    const d = this.viewDate();
    return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly timeSlotsMorning = ['08:30 AM', '10:00 AM', '11:30 AM'];
  readonly timeSlotsAfternoon = ['02:00 PM', '03:30 PM', '05:00 PM'];
  readonly timeSlotsEvening = ['06:30 PM', '07:45 PM'];

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const vDate = this.viewDate();
    const year = vDate.getFullYear();
    const month = vDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as 0, Sunday as 6
    let startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selDate = new Date(this.selectedDate());
    selDate.setHours(0, 0, 0, 0);

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isSelected: false,
        hasSlots: false
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isPast = d.getTime() < today.getTime();
      const isToday = d.getTime() === today.getTime();
      const isSelected = d.getTime() === selDate.getTime();
      const isSunday = d.getDay() === 0;

      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        isPast,
        isSelected,
        hasSlots: !isPast && !isSunday // Sunday is rest day, rest has slots
      });
    }

    // Days for next month padding (up to 35 or 42 total cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        isSelected: false,
        hasSlots: true
      });
    }

    return days;
  });

  readonly formattedSelectedDate = computed(() => {
    const d = this.selectedDate();
    const daysSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = daysSpanish[d.getDay()];
    const dayNum = d.getDate();
    const monthName = this.monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${dayNum} de ${monthName} de ${year}`;
  });

  selectService(service: string): void {
    this.selectedService.set(service);
  }

  selectLocation(location: string): void {
    this.selectedLocation.set(location);
  }

  prevMonth(): void {
    const cur = this.viewDate();
    this.viewDate.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const cur = this.viewDate();
    this.viewDate.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  }

  selectDay(day: CalendarDay): void {
    if (day.isPast) return;
    this.selectedDate.set(day.date);
    if (!day.isCurrentMonth) {
      this.viewDate.set(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
  }

  selectQuickDate(type: 'today' | 'tomorrow' | 'saturday' | 'nextWeek'): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let target = new Date(now);

    if (type === 'today') {
      target = now;
    } else if (type === 'tomorrow') {
      target.setDate(now.getDate() + 1);
    } else if (type === 'saturday') {
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      target.setDate(now.getDate() + daysUntilSaturday);
    } else if (type === 'nextWeek') {
      target.setDate(now.getDate() + 7);
    }

    this.selectedDate.set(target);
    this.viewDate.set(new Date(target.getFullYear(), target.getMonth(), 1));
  }

  selectTimeSlot(slot: string): void {
    this.selectedTimeSlot.set(slot);
  }

  generateCustomWhatsAppUrl(): string {
    const msg = `Hola Danna 👋 Vi tu página web. Quisiera agendar una sesión de *${this.selectedService()}* en *${this.selectedLocation()}* para el *${this.formattedSelectedDate()}* a las *${this.selectedTimeSlot()}*. ¿Tienes este espacio disponible?`;
    return this.wellnessService.getWhatsAppUrl(msg);
  }
}
