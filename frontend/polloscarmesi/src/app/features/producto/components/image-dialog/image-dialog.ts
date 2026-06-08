import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Producto } from '../../interfaces/producto.interface';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-image-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule
  ],
  templateUrl: './image-dialog.html',
  styleUrl: './image-dialog.scss',
})
export class ImageDialog implements OnChanges {
  private readonly productoService = inject(ProductoService);

  @Input() visible = false;
  @Input() producto: Producto | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() uploaded = new EventEmitter<Producto>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = false;
  dragOver = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !this.visible) {
      this.reset();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  upload(): void {
    if (!this.producto || !this.selectedFile) return;
    this.loading = true;
    this.productoService.subirImagenProductoRest(this.producto.id, this.selectedFile).subscribe({
      next: (updatedProduct) => {
        this.loading = false;
        this.uploaded.emit(updatedProduct);
        this.close();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error uploading image', err);
      }
    });
  }

  reset(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.loading = false;
    this.dragOver = false;
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}
