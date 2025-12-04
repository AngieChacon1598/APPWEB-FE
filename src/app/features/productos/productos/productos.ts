import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TablesComponents } from "../../../shared/components/tables-components/tables-components";
import { Producto, ProductoRequest, ProductoUpdateRequest } from '../../../core/services/producto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ReportService } from '../../../core/services/report.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormsComponents } from '../../../shared/components/forms-components/forms-components';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-productos',
  imports: [TablesComponents, CommonModule, FormsModule, FormsComponents],
  templateUrl: './productos.html',
  styleUrl: './productos.scss'
})
export class Productos implements OnInit, OnDestroy {

  private readonly http = inject(ProductoService);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private cartSubscription?: Subscription;

  // Hacer Math disponible en el template
  Math = Math;

  productos: Producto[] = [];
  productosOriginales: Producto[] = []; // Lista original sin filtros
  categorias: any[] = [];
  open: boolean = false;
  loading: boolean = false;
  generatingReportActivos: boolean = false; // Estado para reporte de activos
  generatingReportInactivos: boolean = false; // Estado para reporte de inactivos
  editingProducto: Producto | null = null;
  currentUser: any = null;
  canManageProductos: boolean = false; // ADMIN y EMPLEADO pueden gestionar productos
  showingActiveProducts: boolean = true; // Por defecto mostrar productos activos
  isMenuView: boolean = false; // Detectar si estamos en la vista de menú
  cartItemCount: number = 0; // Contador de items en el carrito
  
  // Propiedades de paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  
  // Filtros
  filtroNombre: string = '';
  filtroCategoria: string = '';
  precioMinimo: number | null = null;
  precioMaximo: number | null = null;

  tituloFormulario: string = 'Crear Producto';

  campos: { nombre: string; tipo: string; etiqueta: string; opciones?: any[] }[] = [
    { nombre: 'name', tipo: 'text', etiqueta: 'Nombre del Producto' },
    { nombre: 'description', tipo: 'text', etiqueta: 'Descripción' },
    { nombre: 'price', tipo: 'number', etiqueta: 'Precio' },
    { nombre: 'categoryId', tipo: 'select', etiqueta: 'Categoría', opciones: [
      { value: 1, label: 'Entradas' },
      { value: 2, label: 'Platos Principales' },
      { value: 3, label: 'Postres' },
      { value: 4, label: 'Bebidas' }
    ]},
    { nombre: 'imagenUrl', tipo: 'text', etiqueta: 'URL de Imagen' }
  ];

  columns: { field: string; header: string }[] = [
    { field: 'menuId', header: 'ID' },
    { field: 'imagenUrl', header: 'Imagen' },
    { field: 'name', header: 'Nombre' },
    { field: 'description', header: 'Descripción' },
    { field: 'price', header: 'Precio' },
    { field: 'category.name', header: 'Categoría' },
    { field: 'state', header: 'Estado' }
  ];

  ngOnInit(): void {
    // Detectar si estamos en la ruta de menus
    this.isMenuView = this.router.url.includes('/menus');
    
    this.loadCurrentUser();
    this.loadCategorias();
    this.getProductos();
    
    // Suscribirse a cambios en el carrito para actualizar el contador
    this.cartSubscription = this.cartService.cart$.subscribe(() => {
      this.cartItemCount = this.cartService.getTotalItems();
    });
    
    // Inicializar el contador del carrito
    this.cartItemCount = this.cartService.getTotalItems();
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.canManageProductos = ['ADMIN', 'EMPLEADO'].includes(user?.role || '');
      console.log('🔐 Productos - Usuario actual:', user);
      console.log('🔐 Productos - Puede gestionar productos:', this.canManageProductos);
    });
  }

  loadCategorias() {
    this.http.getAllCategories().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        console.log('🔍 Categorías cargadas:', categorias);
        
        // Actualizar las opciones del campo de categoría en el formulario
        const categoriaField = this.campos.find(campo => campo.nombre === 'categoryId');
        if (categoriaField) {
          categoriaField.opciones = categorias.map((categoria: any) => ({
            value: categoria.categoryId,
            label: categoria.name
          }));
          console.log('🔍 Opciones de categoría actualizadas:', categoriaField.opciones);
        }
      },
      error: (err) => {
        console.error('❌ Error cargando categorías:', err);
      }
    });
  }

  getProductos() {
    this.loading = true;
    
    // Si es cliente o está en la vista de menú, solo mostrar productos activos
    if (this.currentUser?.role === 'CLIENTE' || this.isMenuView) {
      this.showingActiveProducts = true;
    }
    
    // Si estamos en la vista de menú, cargar TODOS los productos sin paginación
    if (this.isMenuView) {
      this.http.getProductosActivos().subscribe({
        next: (productos: Producto[]) => {
          console.log('🔍 Cargando todos los productos para vista de menú:', productos.length);
          
          // Mapear categorías a los productos
          const productosConCategorias = productos.map((producto: any) => {
            const categoria = this.categorias.find(cat => cat.categoryId === producto.categoryId);
            return {
              ...producto,
              category: categoria || null
            };
          });
          
          this.productos = productosConCategorias;
          this.productosOriginales = productosConCategorias;
          this.totalElements = productosConCategorias.length;
          this.totalPages = 1;
          this.currentPage = 0;
          this.loading = false;
          console.log('✅ Productos cargados en vista de menú:', this.productos.length);
        },
        error: (err) => {
          console.error('❌ Error cargando productos para vista de menú:', err);
          this.loading = false;
        }
      });
      return;
    }
    
    // Para la vista de gestión, usar paginación
    const metodoPaginacion = this.showingActiveProducts 
      ? this.http.getProductosActivosPaginados(this.currentPage, this.pageSize)
      : this.http.getProductosInactivosPaginados(this.currentPage, this.pageSize);
    
    metodoPaginacion.subscribe({
      next: (response) => {
        console.log('🔍 Respuesta paginada del endpoint de productos:', response);
        
        // Determinar si la respuesta es un array directo o un objeto con paginación
        let productos: any[] = [];
        let totalElements = 0;
        let totalPages = 0;
        
        if (Array.isArray(response)) {
          // El backend devuelve un array directo - aplicar paginación del lado del cliente
          const startIndex = this.currentPage * this.pageSize;
          const endIndex = startIndex + this.pageSize;
          productos = response.slice(startIndex, endIndex);
          totalElements = response.length;
          totalPages = Math.ceil(response.length / this.pageSize);
          console.log('🔍 Respuesta es array directo, aplicando paginación del lado del cliente');
          console.log('🔍 Total productos:', response.length);
          console.log('🔍 Página actual:', this.currentPage);
          console.log('🔍 Tamaño de página:', this.pageSize);
          console.log('🔍 Productos en esta página:', productos.length);
        } else if (response && Array.isArray(response.content)) {
          // El backend devuelve un objeto con paginación
          productos = response.content;
          totalElements = response.totalElements || response.content.length;
          totalPages = response.totalPages || Math.ceil(response.content.length / this.pageSize);
          console.log('🔍 Respuesta es objeto con paginación, productos:', productos.length);
        } else {
          console.error('❌ Formato de respuesta no reconocido:', response);
          productos = [];
        }
        
        // Mapear categorías a los productos
        const productosConCategorias = productos.map((producto: any) => {
          const categoria = this.categorias.find(cat => cat.categoryId === producto.categoryId);
          return {
            ...producto,
            category: categoria || { categoryId: producto.categoryId, name: 'Sin categoría', description: '' }
          };
        });
        
        // Mapear categorías a TODOS los productos para filtros (sin paginación)
        const todosLosProductosConCategorias = (Array.isArray(response) ? response : response.content || []).map((producto: any) => {
          const categoria = this.categorias.find(cat => cat.categoryId === producto.categoryId);
          return {
            ...producto,
            category: categoria || { categoryId: producto.categoryId, name: 'Sin categoría', description: '' }
          };
        });
        
        // Actualizar datos de paginación
        this.productos = productosConCategorias;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        
        // Guardar lista original para filtros (TODOS los productos)
        this.productosOriginales = todosLosProductosConCategorias;
        
        this.loading = false;
        
        console.log('=== PRODUCTOS CARGADOS CON PAGINACIÓN ===');
        console.log('Página actual:', this.currentPage);
        console.log('Tamaño de página:', this.pageSize);
        console.log('Total elementos:', this.totalElements);
        console.log('Total páginas:', this.totalPages);
        console.log('Mostrando productos:', this.showingActiveProducts ? 'Activos' : 'Inactivos');
        console.log('Productos en esta página:', this.productos.length);
        console.log('========================================');
      },
      error: (err: any) => {
        console.error('❌ Error obteniendo productos:', err);
        this.loading = false;
      },
    });
  }

  showActiveProducts() {
    this.showingActiveProducts = true;
    this.currentPage = 0; // Resetear a la primera página
    this.getProductos();
  }

  showInactiveProducts() {
    this.showingActiveProducts = false;
    this.currentPage = 0; // Resetear a la primera página
    this.getProductos();
  }

  // Métodos de paginación
  onPageChange(page: number) {
    this.currentPage = page;
    this.getProductos();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0; // Resetear a la primera página
    this.getProductos();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToFirstPage() {
    this.currentPage = 0;
    this.getProductos();
  }

  goToLastPage() {
    this.currentPage = this.totalPages - 1;
    this.getProductos();
  }

  goToPreviousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.getProductos();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.getProductos();
    }
  }

  onPageSizeChangeEvent(event: Event) {
    const target = event.target as HTMLSelectElement;
    const size = parseInt(target.value) || 10;
    this.onPageSizeChange(size);
  }

  aplicarFiltros() {
    let productosFiltrados = [...this.productosOriginales];

    // Filtro por nombre
    if (this.filtroNombre.trim()) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.name.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    // Filtro por categoría
    if (this.filtroCategoria) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.categoryId === parseInt(this.filtroCategoria)
      );
    }

    // Filtro por rango de precios
    if (this.precioMinimo !== null && this.precioMinimo !== undefined) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.price >= this.precioMinimo!
      );
    }

    if (this.precioMaximo !== null && this.precioMaximo !== undefined) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.price <= this.precioMaximo!
      );
    }

    // En la vista de menú, NO aplicar paginación - mostrar todos los productos filtrados
    if (this.isMenuView) {
      this.productos = productosFiltrados;
      this.totalElements = productosFiltrados.length;
      this.totalPages = 1;
      this.currentPage = 0;
      console.log('🔍 Filtros aplicados en vista de menú. Productos encontrados:', productosFiltrados.length);
    } else {
      // Para la vista de gestión, aplicar paginación
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const productosPaginados = productosFiltrados.slice(startIndex, endIndex);
      
      // Actualizar datos de paginación
      this.totalElements = productosFiltrados.length;
      this.totalPages = Math.ceil(productosFiltrados.length / this.pageSize);
      
      this.productos = productosPaginados;
    }
    
    console.log('🔍 Filtros aplicados:');
    console.log('- Nombre:', this.filtroNombre);
    console.log('- Categoría:', this.filtroCategoria);
    console.log('- Precio min:', this.precioMinimo);
    console.log('- Precio max:', this.precioMaximo);
    console.log('- Productos filtrados:', productosFiltrados.length);
    console.log('- Productos en página actual:', this.productos.length);
    console.log('- Página actual:', this.currentPage);
    console.log('- Total páginas:', this.totalPages);
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.precioMinimo = null;
    this.precioMaximo = null;
    
    // Resetear a la primera página y recargar productos
    this.currentPage = 0;
    this.getProductos();
    
    console.log('🔍 Filtros limpiados, recargando productos...');
  }

  openFormulario() {
    this.open = true;
    this.editingProducto = null;
    this.tituloFormulario = 'Crear Producto';
  }

  closeFormulario() {
    this.open = false;
    this.editingProducto = null;
  }

  onEditProducto(producto: any) {
    console.log('Editar producto:', producto);
    this.editingProducto = {
      menuId: producto.menuId,
      imagenUrl: producto.imagenUrl || '',
      name: producto.name,
      description: producto.description,
      price: producto.price,
      state: producto.state,
      categoryId: producto.categoryId,
      createdAt: producto.createdAt,
      updatedAt: producto.updatedAt,
      category: producto.category
    };
    this.tituloFormulario = 'Editar Producto';
    this.open = true;
  }

  onViewProducto(producto: any) {
    console.log('Ver producto:', producto);

    // Si se pasa solo un ID (número), buscar el producto completo
    if (typeof producto === 'number') {
      producto = this.productos.find(p => p.menuId === producto);
      if (!producto) {
        console.error('Producto no encontrado con ID:', producto);
        alert('No se pudo cargar la información del producto');
        return;
      }
    }

    // Validar que el producto tenga los datos necesarios
    if (!producto) {
      console.error('Producto es null o undefined');
      alert('Error: No se pudo cargar la información del producto');
      return;
    }

    // Crear un modal más elegante para mostrar la información completa
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 900px;
      width: 95%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin: -2rem -2rem 1.5rem -2rem; padding: 1.5rem 2rem; background: linear-gradient(to right, #1f2937, #374151); border-radius: 12px 12px 0 0;">
        <h3 style="font-size: 1.5rem; font-weight: bold; color: white; margin: 0;">Detalles del Producto</h3>
        <button id="closeModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: white; transition: color 0.2s; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'; this.style.color='white'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='white'">&times;</button>
      </div>
      
      <div style="display: flex; gap: 2rem; flex-wrap: wrap; flex-direction: row-reverse;">
        <!-- Imagen al lado derecho -->
        <div style="flex: 0 0 300px; min-width: 250px; display: flex; align-items: center; justify-content: center;">
          <img src="${producto.imagenUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4='}" 
               alt="${producto.name || 'Producto'}" 
               style="max-width: 100%; height: auto; max-height: 500px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        </div>
        
        <!-- Detalles al lado izquierdo -->
        <div style="flex: 1; min-width: 300px;">
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">ID:</strong> 
          <span style="color: #6b7280;">${producto.menuId || 'N/A'}</span>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Nombre:</strong> 
          <span style="color: #6b7280;">${producto.name || 'Sin nombre'}</span>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Descripción:</strong>
          <p style="color: #6b7280; margin: 0.5rem 0 0 0; line-height: 1.5; white-space: pre-wrap;">${producto.description || 'Sin descripción'}</p>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Precio:</strong> 
          <span style="color: #059669; font-weight: bold;">S/ ${producto.price ? producto.price.toFixed(2) : '0.00'}</span>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Categoría:</strong> 
          <span style="color: #6b7280;">${producto.category?.name || 'Sin categoría'}</span>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Estado:</strong> 
          <span style="color: ${producto.state === 'A' || producto.state === 1 ? '#059669' : '#dc2626'}; font-weight: bold;">
            ${producto.state === 'A' || producto.state === 1 ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #374151;">Creado:</strong> 
          <span style="color: #6b7280;">${producto.createdAt ? new Date(producto.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no disponible'}</span>
        </div>
        
        <!-- Botón Agregar al Carrito -->
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e5e7eb;">
          <button id="addToCartBtn" style="width: 100%; padding: 0.75rem 1.5rem; background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" 
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px -1px rgba(0, 0, 0, 0.15)';" 
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.1)';">
            🛒 Agregar al Carrito
          </button>
        </div>
        </div>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Cerrar modal al hacer clic en el botón X
    modalContent.querySelector('#closeModal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Agregar al carrito
    const addToCartBtn = modalContent.querySelector('#addToCartBtn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        console.log('🛒 Agregando producto al carrito:', producto);
        this.cartService.addItem(producto, 1);
        alert(`✅ Producto "${producto.name}" agregado al carrito`);
        // Cerrar el modal después de agregar
        document.body.removeChild(modal);
      });
    }

    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  onDeleteProducto(productoId: number) {
    const producto = this.productos.find(p => p.menuId === productoId);
    const productoName = producto ? producto.name : 'este producto';

    if (this.showingActiveProducts) {
      // Eliminación lógica (inactivar)
      if (confirm(`¿Estás seguro de que quieres inactivar ${productoName}?\n\nEl producto será marcado como inactivo.`)) {
        console.log('Inactivando producto:', productoId);

        this.http.deleteProductoLogico(productoId).subscribe({
          next: (response) => {
            console.log('Producto inactivado exitosamente:', response);
            this.showSuccessMessage(`Producto ${productoName} inactivado exitosamente`);
            // Actualizar la lista actual
            this.productos = this.productos.filter(p => p.menuId !== productoId);
          },
          error: (err) => {
            console.error('Error al inactivar producto:', err);
            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para inactivar productos.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de inactivación no existe en el backend.');
    } else {
              this.showErrorMessage('Error al inactivar el producto. Inténtalo de nuevo.');
            }
        }
      });
    }
    } else {
      // Restauración (reactivar)
      if (confirm(`¿Estás seguro de que quieres restaurar ${productoName}?\n\nEl producto será marcado como activo.`)) {
        console.log('Restaurando producto:', productoId);

        this.http.restaurarProducto(productoId).subscribe({
          next: (response) => {
            console.log('Producto restaurado exitosamente:', response);
            this.showSuccessMessage(`Producto ${productoName} restaurado exitosamente`);
            // Actualizar la lista actual
            this.productos = this.productos.filter(p => p.menuId !== productoId);
          },
          error: (err) => {
            console.error('Error al restaurar producto:', err);
            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para restaurar productos.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de restauración no existe en el backend.');
            } else {
              this.showErrorMessage('Error al restaurar el producto. Inténtalo de nuevo.');
            }
        }
      });
    }
  }
  }

  showSuccessMessage(message: string) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 3000);
  }

  showErrorMessage(message: string) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 4000);
  }

  onGuardar(formValue: any) {
    console.log('🔍 === GUARDANDO PRODUCTO ===');
    console.log('🔍 Form value:', formValue);
    console.log('🔍 Editing producto:', this.editingProducto);

    if (this.editingProducto) {
      // Actualizar producto existente
      const updatePayload: ProductoUpdateRequest = {
        menuId: this.editingProducto.menuId,
        imagenUrl: formValue.imagenUrl || this.editingProducto.imagenUrl,
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        state: this.editingProducto.state, // Mantener el estado actual
        categoryId: formValue.categoryId
      };

      console.log('🔍 Payload de actualización:', updatePayload);

      this.http.updateProducto(this.editingProducto.menuId, updatePayload).subscribe({
        next: (response) => {
          console.log('✅ Producto actualizado exitosamente:', response);
          this.showSuccessMessage('Producto actualizado exitosamente');
          this.open = false;
          this.editingProducto = null;
          this.getProductos();
        },
        error: (err) => {
          console.error('❌ Error al actualizar producto:', err);
          console.error('❌ Status:', err.status);
          console.error('❌ Error details:', err.error);
          
          if (err.status === 401) {
            this.showErrorMessage('Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else if (err.status === 403) {
            this.showErrorMessage('No tienes permisos para actualizar productos.');
          } else {
            this.showErrorMessage('Error al actualizar el producto. Inténtalo de nuevo.');
          }
        }
      });
    } else {
      // Crear nuevo producto
      const createPayload: ProductoRequest = {
        imagenUrl: formValue.imagenUrl || '',
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        state: 1, // Activo por defecto
        categoryId: formValue.categoryId
      };

      console.log('🔍 Payload de creación:', createPayload);

      this.http.createProducto(createPayload).subscribe({
        next: (response) => {
          console.log('✅ Producto creado exitosamente:', response);
          this.showSuccessMessage('Producto creado exitosamente');
          this.open = false;
          this.getProductos();
        },
        error: (err) => {
          console.error('❌ Error al crear producto:', err);
          console.error('❌ Status:', err.status);
          console.error('❌ Error details:', err.error);
          
          if (err.status === 401) {
            this.showErrorMessage('Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else if (err.status === 403) {
            this.showErrorMessage('No tienes permisos para crear productos.');
      } else {
            this.showErrorMessage('Error al crear el producto. Inténtalo de nuevo.');
      }
        }
      });
    }
  }

  onLimpiar() {
    console.log('Fue limpiado')
}

  onCerrar() {
    console.log('Formulario cancelado');
    this.open = false;
  }

  /**
   * Ir al formulario de ventas con el carrito
   */
  goToCart(): void {
    this.router.navigate(['/salesticket/form']);
  }

  /**
   * Verificar si el usuario es CLIENTE
   */
  isCliente(): boolean {
    return this.currentUser?.role === 'CLIENTE' || localStorage.getItem('user_role') === 'CLIENTE';
  }

  /**
   * Verificar si el usuario es ADMIN
   */
  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN' || localStorage.getItem('user_role') === 'ADMIN';
  }

  /**
   * Descargar reporte de productos
   * @param stateFilter 1=activos, 0=inactivos, -1=todos
   */
  downloadReport(stateFilter: number = -1): void {
    // Establecer el estado de carga según el filtro
    if (stateFilter === 1) {
      this.generatingReportActivos = true;
    } else if (stateFilter === 0) {
      this.generatingReportInactivos = true;
    }
    
    this.reportService.downloadReport(stateFilter);
    
    // Simular tiempo de carga (el servicio maneja el error)
    setTimeout(() => {
      if (stateFilter === 1) {
        this.generatingReportActivos = false;
      } else if (stateFilter === 0) {
        this.generatingReportInactivos = false;
      }
    }, 2000);
  }

  /**
   * Abrir reporte en nueva ventana
   * @param stateFilter 1=activos, 0=inactivos, -1=todos
   */
  openReport(stateFilter: number = -1): void {
    // Establecer el estado de carga según el filtro
    if (stateFilter === 1) {
      this.generatingReportActivos = true;
    } else if (stateFilter === 0) {
      this.generatingReportInactivos = true;
    }
    
    this.reportService.openReportInNewWindow(stateFilter);
    
    // Simular tiempo de carga (el servicio maneja el error)
    setTimeout(() => {
      if (stateFilter === 1) {
        this.generatingReportActivos = false;
      } else if (stateFilter === 0) {
        this.generatingReportInactivos = false;
      }
    }, 2000);
  }
}