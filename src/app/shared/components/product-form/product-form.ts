import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService, ProductoRequest, ProductoUpdateRequest } from '../../../core/services/producto.service';
import { Product, Category } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductFormComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() isEdit = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Product>();

  categories: Category[] = [];
  loading = false;
  error = '';
  
  formData = {
    name: '',
    description: '',
    price: 0,
    imagenUrl: '',
    categoryId: 0
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.loadCategories();
    
    if (this.isEdit && this.product) {
      this.formData = {
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        imagenUrl: this.product.imagenUrl,
        categoryId: this.product.categoryId
      };
    }
  }

  loadCategories() {
    this.productoService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    const productData = {
      name: this.formData.name,
      description: this.formData.description,
      price: this.formData.price,
      imagenUrl: this.formData.imagenUrl,
      categoryId: this.formData.categoryId,
      state: 1 // Agregar estado activo por defecto
    };

    console.log('🔄 ProductForm - Datos del formulario:', this.formData);
    console.log('🔄 ProductForm - Datos a enviar:', productData);
    console.log('🔄 ProductForm - Es edición:', this.isEdit);

    if (this.isEdit && this.product) {
      // Mapear Product a ProductoUpdateRequest
      const productoRequest: ProductoUpdateRequest = {
        menuId: this.product.menuId,
        imagenUrl: productData.imagenUrl || '',
        name: productData.name,
        description: productData.description,
        price: productData.price,
        state: this.product.state || 1,
        categoryId: productData.categoryId
      };
      
      this.productoService.updateProduct(this.product.menuId, productoRequest).subscribe({
        next: (response) => {
          this.loading = false;
          // Mapear Producto a Product
          const updatedProduct = this.mapProductoToProduct(response);
          this.saved.emit(updatedProduct);
          this.closeModal();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating product:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          
          if (error.status === 500) {
            this.error = 'Error interno del servidor. Verifique los datos ingresados.';
          } else if (error.status === 400) {
            this.error = 'Datos inválidos. Verifique que todos los campos estén correctos.';
          } else if (error.status === 401) {
            this.error = 'No autorizado. Por favor, inicie sesión nuevamente.';
          } else {
            this.error = `Error al actualizar el producto: ${error.message || 'Error desconocido'}`;
          }
        }
      });
    } else {
      // Mapear Product a ProductoRequest
      const productoRequest: ProductoRequest = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        imagenUrl: productData.imagenUrl || ''
      };
      
      this.productoService.createProduct(productoRequest).subscribe({
        next: (response) => {
          this.loading = false;
          // Mapear Producto a Product
          const newProduct = this.mapProductoToProduct(response);
          this.saved.emit(newProduct);
          this.closeModal();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating product:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          
          if (error.status === 500) {
            this.error = 'Error interno del servidor. Verifique los datos ingresados.';
          } else if (error.status === 400) {
            this.error = 'Datos inválidos. Verifique que todos los campos estén correctos.';
          } else if (error.status === 401) {
            this.error = 'No autorizado. Por favor, inicie sesión nuevamente.';
          } else {
            this.error = `Error al crear el producto: ${error.message || 'Error desconocido'}`;
          }
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    if (!this.formData.description.trim()) {
      this.error = 'La descripción es obligatoria';
      return false;
    }
    
    if (this.formData.price <= 0) {
      this.error = 'El precio debe ser mayor a 0';
      return false;
    }
    
    if (this.formData.categoryId === 0) {
      this.error = 'Debe seleccionar una categoría';
      return false;
    }

    return true;
  }

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // Función para mapear Producto a Product
  private mapProductoToProduct(producto: any): Product {
    return {
      menuId: producto.menuId || 0,
      name: producto.name || '',
      description: producto.description || '',
      price: producto.price || 0,
      imagenUrl: producto.imagenUrl || '',
      categoryId: producto.categoryId || 1,
      state: producto.state || 1,
      createdAt: producto.createdAt || new Date().toISOString(),
      updatedAt: null
    };
  }

  // Función para obtener el nombre de la categoría por ID
  private getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.categoryId === categoryId);
    return category ? category.name : 'ENTRADA';
  }

  // Función para obtener el ID de la categoría por nombre
  private getCategoryId(categoryName: string): number {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.categoryId : 1;
  }
}
