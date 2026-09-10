import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ChatMessage } from '../../../services/rag.service';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message" [class.user]="!isAssistant" [class.assistant]="isAssistant">
      <div class="message-content" *ngIf="isAssistant" [innerHTML]="renderedContent"></div>
      <div class="message-content" *ngIf="!isAssistant">{{ message.content }}</div>
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
    </div>
  `,
  styleUrl: './message-item.scss',
})
export class ChatMessageItem {
  @Input() message!: ChatMessage;
  @Input() isAssistant = false;

  constructor(private sanitizer: DomSanitizer) {}

  get renderedContent(): SafeHtml {
    const html = marked.parse(this.message.content, { async: false, breaks: true }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(html));
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
