import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService, ChatMessage } from '../../services/rag.service';
import { ChatMessageItem } from './message-item/message-item';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageItem],
  templateUrl: './chat-drawer.html',
  styleUrl: './chat-drawer.scss',
})
export class ChatDrawer implements AfterViewChecked {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesList') messagesList?: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  inputMessage = '';
  isLoading = false;
  errorMessage = '';

  constructor(private ragService: RagService) {}

  ngAfterViewChecked() {
    // Auto-scroll to bottom
    if (this.messagesList) {
      const element = this.messagesList.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  onClose() {
    this.close.emit();
  }

  onSendMessage() {
    if (!this.inputMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.inputMessage,
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    this.inputMessage = '';
    this.isLoading = true;
    this.errorMessage = '';

    // Add placeholder for assistant response
    const assistantPlaceholder: ChatMessage = {
      role: 'assistant',
      content: 'Escribiendo...',
      timestamp: new Date(),
    };
    this.messages.push(assistantPlaceholder);

    // Call RAG service
    let fullResponse = '';
    this.ragService.chat(userMessage.content, this.messages.slice(0, -1)).subscribe({
      next: (chunk: string) => {
        fullResponse += chunk;
        // Update placeholder in real-time
        if (this.messages.length > 0) {
          this.messages[this.messages.length - 1].content = fullResponse;
        }
      },
      error: (error: any) => {
        console.error('Chat error:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al procesar tu pregunta. Intenta de nuevo.';

        // Remove placeholder
        if (this.messages[this.messages.length - 1].content === 'Escribiendo...') {
          this.messages.pop();
        }
      },
      complete: () => {
        this.isLoading = false;
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === 'Escribiendo...') {
          lastMessage.content = fullResponse || 'No pude procesar tu pregunta.';
        }
      },
    });
  }

  clearChat() {
    this.messages = [];
    this.inputMessage = '';
    this.errorMessage = '';
  }
}
