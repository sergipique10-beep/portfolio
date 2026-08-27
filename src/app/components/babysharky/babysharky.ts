import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-babysharky',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="babysharky"
      (click)="onOpen()"
      [attr.aria-label]="'Abrir chat con Babysharky'"
      type="button"
    >
      <img
        src="/assets/babysharky.png"
        alt="Babysharky - Chat mascot"
        class="babysharky-icon"
      />

      <!-- Unread badge (optional, hidden by default) -->
      <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
    </button>
  `,
  styleUrl: './babysharky.scss',
})
export class Babysharky {
  @Output() openChat = new EventEmitter<void>();

  unreadCount = 0;

  onOpen() {
    this.openChat.emit();
    this.unreadCount = 0;
  }

  setUnreadCount(count: number) {
    this.unreadCount = count;
  }
}
