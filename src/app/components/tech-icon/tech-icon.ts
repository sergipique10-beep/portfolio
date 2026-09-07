import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tech-icon',
  templateUrl: './tech-icon.html',
  styleUrl: './tech-icon.scss'
})
export class TechIcon {
  @Input({ required: true }) name!: string;
}
