import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { Configuracion, ConfiguracionInput } from '../../interfaces/configuracion.interface';

declare const L: any;

@Component({
  selector: 'app-contenido-edicion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './contenido-edicion.html',
  styleUrl: './contenido-edicion.scss',
})
export class ContenidoEdicion implements OnChanges, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  @Input() configuracion: Configuracion | null = null;
  @Input() saving = false;

  @Output() save = new EventEmitter<ConfiguracionInput>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  private map: any = null;
  private marker: any = null;

  constructor() {
    this.form = this.fb.group({
      nombreRestaurante: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      horarioAtencion: ['', [Validators.required]],
      tiempoMaximoPreparacion: [30, [Validators.required, Validators.min(1)]],
      umbralAlertaCocina: [10, [Validators.required, Validators.min(1)]],
      coordenadas: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configuracion'] && this.configuracion) {
      this.form.patchValue({
        nombreRestaurante: this.configuracion.nombreRestaurante,
        ruc: this.configuracion.ruc,
        direccion: this.configuracion.direccion,
        telefono: this.configuracion.telefono,
        horarioAtencion: this.configuracion.horarioAtencion,
        tiempoMaximoPreparacion: this.configuracion.tiempoMaximoPreparacion,
        umbralAlertaCocina: this.configuracion.umbralAlertaCocina,
        coordenadas: this.configuracion.coordenadas
      });

      if (this.map && this.marker) {
        const { lat, lng } = this.getLatLgn();
        this.marker.setLatLng([lat, lng]);
        this.map.setView([lat, lng], this.map.getZoom());
      }
    }
  }

  ngAfterViewInit(): void {
    this.loadLeaflet().then(() => {
      this.initMap();
    }).catch(err => console.error('Error loading Leaflet map from CDN', err));
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).L) {
        resolve();
        return;
      }

      // 1. Inject Leaflet CSS Link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.id = 'leaflet-css-cdn';
      document.head.appendChild(link);

      // 2. Inject Leaflet JS Script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js-cdn';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  private getLatLgn(): { lat: number; lng: number } {
    const coordsStr = this.form.get('coordenadas')?.value || '-13.518333,-71.978056';
    const parts = coordsStr.split(',');
    const lat = parseFloat(parts[0]) || -13.518333;
    const lng = parseFloat(parts[1]) || -71.978056;
    return { lat, lng };
  }

  private initMap(): void {
    const { lat, lng } = this.getLatLgn();
    
    // Initialize map
    this.map = L.map('config-map').setView([lat, lng], 15);

    // Add osm tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add marker
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    // Listen to marker drag events
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.onLocationSelected(position.lat, position.lng);
    });

    // Listen to map click events
    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.onLocationSelected(lat, lng);
    });
  }

  private onLocationSelected(lat: number, lng: number): void {
    const coordsStr = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    this.form.get('coordenadas')?.setValue(coordsStr);

    // Query Nominatim reverse geocoding API
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.address) {
          const addr = res.address;
          const parts: string[] = [];

          // Calle / Avenida / Vía (with fallbacks for other street type keys in OSM)
          const street = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || addr.square || addr.highway;
          if (street) {
            parts.push(street);
          }
          if (addr.neighbourhood) {
            parts.push(addr.neighbourhood);
          }
          if (addr.suburb) {
            parts.push(addr.suburb);
          }

          const cleanAddress = parts.join(', ');
          if (cleanAddress) {
            this.form.get('direccion')?.setValue(cleanAddress);
          } else if (res.display_name) {
            this.form.get('direccion')?.setValue(res.display_name);
          }
        } else if (res && res.display_name) {
          this.form.get('direccion')?.setValue(res.display_name);
        }
      },
      error: (err) => {
        console.error('Error during reverse geocoding address', err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
