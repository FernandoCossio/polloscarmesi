import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seccion-comprobante',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seccion-comprobante.html',
  styleUrl: './seccion-comprobante.scss',
})
export class SeccionComprobante {
  @Output() fileSelect = new EventEmitter<File | null>();

  selectedFile: File | null = null;
  isDragging = false;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.setFile(event.dataTransfer.files[0]);
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileSelect.emit(null);
  }

  private setFile(file: File): void {
    const isImageOrPdf = file.type.match(/image\/*/) || file.type === 'application/pdf';
    const isUnder5Mb = file.size <= 5 * 1024 * 1024;

    if (isImageOrPdf && isUnder5Mb) {
      this.selectedFile = file;
      this.fileSelect.emit(file);
    } else {
      alert('Archivo no soportado o excede el límite de 5MB. Formatos válidos: JPG, PNG, PDF.');
    }
  }
}
