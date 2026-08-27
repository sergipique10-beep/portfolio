import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../services/rag.service';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message" [class.user]="!isAssistant" [class.assistant]="isAssistant">
      <div class="message-content">{{ message.content }}</div>
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
    </div>
  `,
  styleUrl: './message-item.scss',
})
export class ChatMessageItem {
  @Input() message!: ChatMessage;
  @Input() isAssistant = false;

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
