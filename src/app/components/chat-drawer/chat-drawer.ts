import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
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
  @ViewChild('inputTextarea') inputTextarea?: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  inputMessage = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private ragService: RagService,
    private cdr: ChangeDetectorRef
  ) {}

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
    const messageContent = this.inputMessage; // Save before clearing
    this.inputMessage = ''; // Clear input immediately
    if (this.inputTextarea) {
      this.inputTextarea.nativeElement.value = ''; // Force clear textarea
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Force update to clear textarea

    // Add placeholder for assistant response
    const assistantPlaceholder: ChatMessage = {
      role: 'assistant',
      content: 'Escribiendo...',
      timestamp: new Date(),
    };
    this.messages.push(assistantPlaceholder);

    // Call RAG service
    let fullResponse = '';
    console.log('[Chat] Sending message:', messageContent);
    this.ragService.chat(userMessage.content).subscribe({
      next: (chunk: string) => {
        console.log('[Chat] Received chunk:', chunk.length, 'chars');
        fullResponse += chunk;
        // Update placeholder in real-time
        if (this.messages.length > 0) {
          this.messages[this.messages.length - 1].content = fullResponse;
          // CRITICAL: Force change detection for streaming updates
          this.cdr.markForCheck();
        }
      },
      error: (error: any) => {
        console.error('[Chat] Error:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al procesar tu pregunta. Intenta de nuevo.';

        // Remove placeholder
        if (this.messages[this.messages.length - 1]?.content === 'Escribiendo...') {
          this.messages.pop();
        }
        this.cdr.markForCheck();
      },
      complete: () => {
        console.log('[Chat] Response complete, length:', fullResponse.length);
        this.isLoading = false;
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === 'Escribiendo...') {
          lastMessage.content = fullResponse || 'No pude procesar tu pregunta.';
        }
        this.cdr.markForCheck();
      },
    });
  }

  clearChat() {
    this.messages = [];
    this.inputMessage = '';
    this.errorMessage = '';
  }
}
