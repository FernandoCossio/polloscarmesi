import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-categoria-filter',
  standalone: true,
  imports: [CommonModule, InputTextModule, ButtonModule, IconFieldModule, InputIconModule],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
})
export class Filter {
  @Output() searchChange = new EventEmitter<string>();
  @Output() newCategoryClick = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
  }
}
