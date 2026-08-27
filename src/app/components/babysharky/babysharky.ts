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
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="babysharky-icon">
        <!-- Simple baby shark illustration -->
        <!-- Body -->
        <ellipse cx="50" cy="55" rx="28" ry="35" fill="#00d9ff" />

        <!-- Head -->
        <circle cx="50" cy="28" r="22" fill="#00d9ff" />

        <!-- Eyes -->
        <circle cx="42" cy="24" r="5" fill="#fff" />
        <circle cx="58" cy="24" r="5" fill="#fff" />
        <circle cx="42" cy="24" r="3" fill="#000" />
        <circle cx="58" cy="24" r="3" fill="#000" />

        <!-- Mouth (smile) -->
        <path d="M 45 32 Q 50 35 55 32" stroke="#000" stroke-width="1.5" fill="none" stroke-linecap="round" />

        <!-- Dorsal fin -->
        <polygon points="50,20 45,8 55,8" fill="#0099cc" />

        <!-- Pectoral fins -->
        <ellipse cx="30" cy="50" rx="8" ry="12" fill="#00b8e6" transform="rotate(-30 30 50)" />
        <ellipse cx="70" cy="50" rx="8" ry="12" fill="#00b8e6" transform="rotate(30 70 50)" />

        <!-- Tail fin -->
        <path d="M 60 80 Q 75 75 80 85 Q 75 90 60 85" fill="#0099cc" />

        <!-- Glow effect (circle behind) -->
        <circle cx="50" cy="55" r="45" fill="none" stroke="#00d9ff" stroke-width="1" opacity="0.3" />
      </svg>

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
