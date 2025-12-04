import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesTicketService } from '../../../core/services/salesticket.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Product, Category } from '../../../core/models/usuario.models';
import { SalesTicket, ProductDetailDTO } from '../../../core/models/salesticket.models';

interface OrderItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-salesticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEdit ? 'Editar Ticket #' + salesId : 'Crear Nuevo Ticket' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              {{ isEdit ? 'Modifica los datos del ticket de venta' : 'Completa la información del ticket de venta' }}
            </p>
          </div>
          <button 
            (click)="goBack()"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">{{ isEdit ? 'Cargando datos del ticket...' : 'Cargando formulario...' }}</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p class="mb-2">Error: {{ error }}</p>
        <button (click)="loadData()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          Reintentar
        </button>
      </div>

      <!-- Formulario -->
      <form *ngIf="!loading && !error" [formGroup]="salesForm" (ngSubmit)="onSubmit()" class="space-y-6">
        
        <!-- SECCIÓN CABECERA -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-3 shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Información del Ticket</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Completa los datos del pedido</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Entrega -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entrega a Domicilio *
              </label>
              <select 
                formControlName="delivery" 
                [class.border-red-500]="isFieldInvalid('delivery')"
                [class.border-gray-300]="!isFieldInvalid('delivery')"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Seleccionar...</option>
                <option *ngFor="let option of deliveryOptions" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div *ngIf="isFieldInvalid('delivery')" class="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                {{ getFieldError('delivery') }}
              </div>
            </div>

            <!-- Dirección de Entrega -->
            <div *ngIf="salesForm.get('delivery')?.value === 'SI'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección de Entrega *
              </label>
              <input
                type="text"
                formControlName="deliveryAddress"
                [class.border-red-500]="isFieldInvalid('deliveryAddress')"
                [class.border-gray-300]="!isFieldInvalid('deliveryAddress')"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ej: Av. Principal 123, Distrito, Ciudad"
              />
              <div *ngIf="isFieldInvalid('deliveryAddress')" class="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                {{ getFieldError('deliveryAddress') }}
              </div>
              <div *ngIf="!isFieldInvalid('deliveryAddress') && salesForm.get('deliveryAddress')?.value" class="text-green-600 text-xs mt-1">
                ✓ Dirección válida
              </div>
            </div>

            <!-- Tipo de Pago -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Pago *
              </label>
              <select 
                formControlName="idPaymentType" 
                [class.border-red-500]="isFieldInvalid('idPaymentType')"
                [class.border-gray-300]="!isFieldInvalid('idPaymentType')"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Seleccionar...</option>
                <option *ngFor="let payment of paymentTypes" [value]="payment.id">
                  {{ payment.name }}
                </option>
              </select>
              <div *ngIf="isFieldInvalid('idPaymentType')" class="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                {{ getFieldError('idPaymentType') }}
              </div>
            </div>

            <!-- Estado de Orden (Solo lectura) -->
            <div class="ml-6">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Estado de Orden
              </label>
              <div class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg shadow-sm">
                <div class="flex items-center gap-1.5">
                  <div class="relative">
                    <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div class="absolute top-0 left-0 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md text-xs font-semibold shadow-sm">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Pendiente
                  </span>
                </div>
              </div>
            </div>

            <!-- Notas -->
            <div class="md:col-span-2 lg:col-span-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas <span class="text-gray-500 text-xs">(Opcional, máximo 500 caracteres)</span>
              </label>
              <textarea
                formControlName="note"
                rows="3"
                [class.border-red-500]="isFieldInvalid('note')"
                [class.border-gray-300]="!isFieldInvalid('note')"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Notas adicionales del pedido..."
                maxlength="500"
              ></textarea>
              <div class="flex justify-between items-center mt-1">
                <div *ngIf="isFieldInvalid('note')" class="text-red-500 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                  {{ getFieldError('note') }}
                </div>
                <div class="text-xs text-gray-500 ml-auto">
                  {{ salesForm.get('note')?.value?.length || 0 }}/500 caracteres
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN DETALLE DE PRODUCTOS -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <!-- Header mejorado -->
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-3 shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Detalle de Productos</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Agrega productos al pedido seleccionando categoría y producto</p>
            </div>
          </div>
          
          <!-- Selectores de Productos mejorados -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Categoría -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  Categoría
                </label>
                <select 
                  formControlName="selectedCategoryId"
                  (change)="onCategoryChange()"
                  class="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">Seleccionar categoría...</option>
                  <option *ngFor="let category of categories" [value]="category.categoryId">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Producto -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  Producto
                </label>
                <select 
                  formControlName="selectedProductId"
                  [disabled]="!salesForm.get('selectedCategoryId')?.value"
                  class="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Seleccionar producto...</option>
                  <option *ngFor="let product of filteredProducts" [value]="product.menuId">
                    {{ product.name }} - {{ formatCurrency(product.price) }}
                  </option>
                </select>
              </div>

              <!-- Cantidad -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Cantidad (1-100)
                </label>
                <input
                  type="number"
                  formControlName="selectedQuantity"
                  min="1"
                  max="100"
                  [disabled]="!salesForm.get('selectedProductId')?.value"
                  [class.border-red-500]="isFieldInvalid('selectedQuantity')"
                  [class.border-gray-300]="!isFieldInvalid('selectedQuantity')"
                  class="w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60"
                  placeholder="1"
                />
                <div *ngIf="isFieldInvalid('selectedQuantity')" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                  {{ getFieldError('selectedQuantity') }}
                </div>
              </div>

              <!-- Botón Agregar mejorado -->
              <div class="flex items-end">
                <button
                  type="button"
                  (click)="addProductToOrder()"
                  [disabled]="!salesForm.get('selectedProductId')?.value || !salesForm.get('selectedQuantity')?.value || toNumber(salesForm.get('selectedQuantity')?.value) < 1"
                  class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla de Pedido mejorada -->
          <div *ngIf="orderItems.length > 0" class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Productos Seleccionados</h3>
              <span class="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                {{ orderItems.length }} {{ orderItems.length === 1 ? 'producto' : 'productos' }}
              </span>
            </div>
            <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Precio Unit.</th>
                    <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                    <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr *ngFor="let item of orderItems; let i = index" class="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                          </svg>
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.product.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.product.description }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ formatCurrency(item.product.price) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {{ item.quantity }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatCurrency(item.subtotal) }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        (click)="removeProductFromOrder(i)"
                        class="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 rounded-lg transition-all duration-200"
                        title="Eliminar producto"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <td colspan="3" class="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Subtotal:
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(calculateSubtotal()) }}</span>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="3" class="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      IGV (18%):
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(calculateIGV()) }}</span>
                    </td>
                    <td></td>
                  </tr>
                  <tr class="border-t-2 border-gray-300 dark:border-gray-600">
                    <td colspan="3" class="px-6 py-4 text-right text-base font-bold text-gray-900 dark:text-white">
                      Total:
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class="text-xl font-extrabold text-green-600 dark:text-green-400">{{ formatCurrency(calculateTotalWithIGV()) }}</span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Mensaje cuando no hay productos -->
          <div *ngIf="orderItems.length === 0" class="text-center py-12 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
              <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <p class="text-base font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ No hay productos agregados al pedido</p>
            <p class="text-sm text-yellow-700 dark:text-yellow-400">Debe agregar al menos un producto para crear el ticket</p>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p>Subtotal: <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(calculateSubtotal()) }}</span></p>
              <p>IGV (18%): <span class="font-semibold text-blue-600 dark:text-blue-400">{{ formatCurrency(calculateIGV()) }}</span></p>
              <p>Total: <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(calculateTotalWithIGV()) }}</span></p>
              <p>Productos en el pedido: <span class="font-semibold">{{ orderItems.length }}</span></p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="goBack()"
                class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="salesForm.invalid || orderItems.length === 0 || loading"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <svg *ngIf="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isEdit ? 'Actualizar Ticket' : 'Crear Ticket' }}
              </button>
            </div>
          </div>
        </div>
      </form>

      <!-- Success Message - Toast Notification -->
      <div *ngIf="success" class="fixed top-4 right-4 z-50 animate-slide-in-right">
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md border-l-4 border-green-700">
          <div class="flex-shrink-0">
            <svg class="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-lg">{{ success }}</p>
            <p class="text-sm text-green-50 mt-1">Redirigiendo...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `]
})
export class SalesTicketFormComponent implements OnInit {
  salesForm: FormGroup;
  isEdit = false;
  salesId: number | null = null;
  loading = false;
  error = '';
  success = '';
  
  // Guardar el ticket original para edición
  originalTicket: any = null;

  // Datos para el formulario
  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Items del pedido
  orderItems: OrderItem[] = [];

  // Opciones para selects
  deliveryOptions = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' }
  ];

  paymentTypes = [
    { id: 1, name: 'Efectivo' },
    { id: 2, name: 'Tarjeta' },
    { id: 3, name: 'Transferencia' }
  ];

  orderStatuses = [
    { id: 1, name: 'Pendiente' },
    { id: 2, name: 'En Proceso' },
    { id: 3, name: 'Completado' },
    { id: 4, name: 'Cancelado' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private salesTicketService: SalesTicketService,
    private productoService: ProductoService,
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.salesForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

      createForm(): FormGroup {
        const form = this.fb.group({
          // totalPayment ya no es necesario en el formulario, se calcula automáticamente
          delivery: ['', [Validators.required]],
          deliveryAddress: [''],
          note: ['', [Validators.maxLength(500), this.notePatternValidator()]],
          idPaymentType: ['', [Validators.required]],
          idTypeState: [1, [Validators.required]], // Estado por defecto: Pendiente (ID: 1)
          // Campos para el selector de productos
          selectedCategoryId: [''],
          selectedProductId: [''],
          selectedQuantity: [1, [Validators.required, Validators.min(1), Validators.max(100)]]
        });

        // Validación condicional: deliveryAddress es requerido solo si delivery es 'SI'
        form.get('delivery')?.valueChanges.subscribe(delivery => {
          const deliveryAddressControl = form.get('deliveryAddress');
          if (delivery === 'SI') {
            deliveryAddressControl?.setValidators([
              Validators.required,
              Validators.minLength(10),
              Validators.maxLength(200),
              this.addressPatternValidator()
            ]);
          } else {
            deliveryAddressControl?.clearValidators();
            deliveryAddressControl?.setValue('');
          }
          deliveryAddressControl?.updateValueAndValidity({ emitEvent: false });
        });

        return form;
      }

      // Validador personalizado para formato de dirección
      addressPatternValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
          if (!control.value) {
            return null;
          }
          const address = control.value.trim();
          
          // Validar que tenga al menos 10 caracteres
          if (address.length < 10) {
            return { minLength: { requiredLength: 10, actualLength: address.length } };
          }
          
          // Validar que contenga letras (incluyendo acentos y ñ)
          const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(address);
          if (!hasLetters) {
            return { invalidAddress: { message: 'La dirección debe contener letras' } };
          }
          
          // Validar que solo contenga letras, números, espacios y caracteres especiales permitidos
          // Caracteres permitidos: letras, números, espacios, guiones (-), símbolo de número (#), punto (.), coma (,)
          const allowedPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-#.,]+$/;
          if (!allowedPattern.test(address)) {
            return { invalidAddress: { message: 'La dirección solo puede contener letras, números, espacios y los caracteres: - # . ,' } };
          }
          
          return null;
        };
      }

      // Validador personalizado para formato de notas
      notePatternValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
          // Si el campo está vacío, es válido (es opcional)
          if (!control.value || control.value.trim() === '') {
            return null;
          }
          
          const note = control.value.trim();
          
          // Validar que contenga letras (no puede ser solo números)
          const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(note);
          if (!hasLetters) {
            return { invalidNote: { message: 'Las notas no pueden contener solo números. Debe incluir al menos una letra' } };
          }
          
          // Validar que solo contenga letras, números y espacios (sin caracteres especiales)
          const allowedPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]+$/;
          if (!allowedPattern.test(note)) {
            return { invalidNote: { message: 'Las notas solo pueden contener letras, números y espacios. No se permiten caracteres especiales' } };
          }
          
          return null;
        };
      }

      // Validador personalizado para verificar que hay productos en el pedido
      hasProductsValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
          if (this.orderItems.length === 0) {
            return { noProducts: { message: 'Debe agregar al menos un producto al pedido' } };
          }
          return null;
        };
      }

      // Validador personalizado para verificar total mínimo
      minTotalValidator(minTotal: number = 0.01): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
          const total = this.calculateTotalWithIGV();
          if (total < minTotal) {
            return { minTotal: { required: minTotal, actual: total } };
          }
          return null;
        };
      }

  loadData(): void {
    console.log('🔄 SalesTicketForm - Iniciando carga de datos...');
    this.loading = true;
    this.error = '';
    
    // Determinar si es edición
    this.salesId = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : null;
    this.isEdit = !!this.salesId;
    console.log('🔄 SalesTicketForm - Modo:', this.isEdit ? 'Edición' : 'Creación');
    console.log('🔄 SalesTicketForm - ID:', this.salesId);

    // Timeout de seguridad (10 segundos)
    const timeout = setTimeout(() => {
      console.error('❌ SalesTicketForm - Timeout cargando datos');
      this.error = 'Timeout: Los datos tardaron demasiado en cargar. Verifique su conexión.';
      this.loading = false;
    }, 10000);

    // Cargar datos básicos
    Promise.all([
      this.loadCategories(),
      this.loadProducts(),
      this.isEdit ? this.loadSalesTicket() : Promise.resolve()
    ]).then(() => {
      // Si no es edición y hay productos en el carrito, cargarlos
      if (!this.isEdit) {
        this.loadCartItems();
      }
      console.log('✅ SalesTicketForm - Todos los datos cargados exitosamente');
      console.log('🔍 SalesTicketForm - Debug final:');
      console.log('  - Categorías cargadas:', this.categories.length);
      console.log('  - Productos cargados:', this.products.length);
      console.log('  - Categorías:', this.categories);
      console.log('  - Productos:', this.products);
      
      // Debug de tipos de datos
      if (this.categories.length > 0) {
        console.log('🔍 SalesTicketForm - Primera categoría:', this.categories[0]);
        console.log('🔍 SalesTicketForm - Tipo categoryId:', typeof this.categories[0].categoryId);
      }
      if (this.products.length > 0) {
        console.log('🔍 SalesTicketForm - Primer producto:', this.products[0]);
        console.log('🔍 SalesTicketForm - Tipo categoryId:', typeof this.products[0].categoryId);
        console.log('🔍 SalesTicketForm - Tipo state:', typeof this.products[0].state);
        
        // Debug de todos los productos
        console.log('🔍 SalesTicketForm - Todos los productos con sus categorías:');
        this.products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - Categoría: ${product.categoryId} (${typeof product.categoryId}), Estado: ${product.state} (${typeof product.state})`);
        });
      }
      
      clearTimeout(timeout);
      this.loading = false;
    }).catch((error) => {
      console.error('❌ SalesTicketForm - Error cargando datos:', error);
      clearTimeout(timeout);
      this.error = 'Error al cargar los datos del formulario: ' + error.message;
      this.loading = false;
    });
  }

  loadCategories(): Promise<void> {
    console.log('🔄 SalesTicketForm - Cargando categorías...');
    return new Promise((resolve, reject) => {
      this.productoService.getAllCategories().subscribe({
        next: (categories) => {
          this.categories = categories;
          console.log('✅ SalesTicketForm - Categorías cargadas:', categories.length);
          console.log('✅ SalesTicketForm - Categorías:', categories);
          
          // Log detallado de cada categoría
          categories.forEach((category: Category) => {
            console.log(`📂 Categoría ${category.categoryId}: ${category.name}, estado: ${category.state}`);
          });
          
          resolve();
        },
        error: (error) => {
          console.error('❌ SalesTicketForm - Error cargando categorías:', error);
          this.error = 'Error al cargar las categorías: ' + error.message;
          reject(error);
        }
      });
    });
  }

  loadProducts(): Promise<void> {
    console.log('🔄 SalesTicketForm - Cargando productos...');
    return new Promise((resolve, reject) => {
      this.productoService.getAllProducts().subscribe({
        next: (response) => {
          this.products = response.map((producto: any) => ({
            menuId: producto.menuId,
            name: producto.name,
            description: producto.description,
            price: producto.price,
            imagenUrl: producto.imageUrl || '',
            categoryId: producto.categoryId,
            state: producto.state,
            createdAt: producto.createdAt,
            updatedAt: null
          })) || [];
          console.log('✅ SalesTicketForm - Productos cargados:', this.products.length);
          console.log('✅ SalesTicketForm - Productos:', this.products);
          
          // Log detallado de cada producto
          this.products.forEach((product: Product) => {
            console.log(`📦 Producto ${product.menuId}: ${product.name}, categoría: ${product.categoryId}, estado: ${product.state}`);
          });
          
          resolve();
        },
        error: (error) => {
          console.error('❌ SalesTicketForm - Error cargando productos:', error);
          this.error = 'Error al cargar los productos: ' + error.message;
          reject(error);
        }
      });
    });
  }

  loadSalesTicket(): Promise<void> {
    if (!this.salesId) return Promise.resolve();
    
    console.log('🔄 SalesTicketForm - Cargando ticket:', this.salesId);
    return new Promise((resolve, reject) => {
      this.salesTicketService.getSalesTicketById(this.salesId!).subscribe({
        next: (ticket) => {
          // Guardar el ticket original para usar sus datos al actualizar
          this.originalTicket = ticket;
          this.populateForm(ticket);
          this.populateOrderItems(ticket);
          console.log('✅ SalesTicketForm - Ticket cargado:', ticket);
          console.log('✅ SalesTicketForm - Ticket original guardado:', this.originalTicket);
          resolve();
        },
        error: (error) => {
          console.error('❌ SalesTicketForm - Error cargando ticket:', error);
          this.error = 'Error al cargar el ticket: ' + error.message;
          reject(error);
        }
      });
    });
  }

  populateForm(ticket: any): void {
    this.salesForm.patchValue({
      // totalPayment ya no se usa en el formulario
      delivery: ticket.delivery,
      deliveryAddress: ticket.deliveryAddress,
      note: ticket.note,
      idPaymentType: ticket.idPaymentType,
      idTypeState: 1 // Siempre establecer como Pendiente
    });
    this.updateTotalInForm();
  }

  populateOrderItems(ticket: any): void {
    if (ticket.productDetails && ticket.productDetails.length > 0) {
      this.orderItems = ticket.productDetails.map((detail: any) => {
        const product = this.products.find(p => p.menuId === detail.menuId);
        return {
          product: product || { menuId: detail.menuId, name: detail.menuName, price: detail.menuPrice, description: '', imagenUrl: '', state: 1, categoryId: 0, createdAt: '', updatedAt: null },
          quantity: detail.amount,
          subtotal: detail.menuPrice * detail.amount
        };
      });
    }
  }

  /**
   * Carga los productos del carrito al formulario
   */
  loadCartItems(): void {
    const cartItems = this.cartService.getItems();
    if (cartItems.length > 0) {
      console.log('🛒 Cargando productos del carrito:', cartItems);
      
      // Convertir items del carrito a orderItems
      this.orderItems = cartItems.map(cartItem => {
        const product = this.products.find(p => p.menuId === cartItem.menuId);
        if (product) {
          return {
            product: product,
            quantity: cartItem.quantity,
            subtotal: cartItem.subtotal
          };
        } else {
          // Si no se encuentra el producto en la lista, crear uno básico
          return {
            product: {
              menuId: cartItem.menuId,
              name: cartItem.name,
              description: cartItem.description,
              price: cartItem.price,
              imagenUrl: cartItem.imagenUrl || '',
              state: 1,
              categoryId: 0,
              createdAt: '',
              updatedAt: null
            },
            quantity: cartItem.quantity,
            subtotal: cartItem.subtotal
          };
        }
      });
      
      // Actualizar el total en el formulario
      this.updateTotalInForm();
      
      console.log('✅ Productos del carrito cargados:', this.orderItems.length);
    }
  }

  onCategoryChange(): void {
    const selectedCategoryId = this.salesForm.get('selectedCategoryId')?.value;
    console.log('🔄 SalesTicketForm - Categoría seleccionada:', selectedCategoryId, typeof selectedCategoryId);
    console.log('🔄 SalesTicketForm - Total productos disponibles:', this.products.length);
    console.log('🔄 SalesTicketForm - Productos disponibles:', this.products);
    
    this.salesForm.patchValue({ selectedProductId: '', selectedQuantity: 1 });
    
    if (selectedCategoryId) {
      // Convertir a número para comparación
      const categoryIdNum = Number(selectedCategoryId);
      console.log('🔄 SalesTicketForm - Categoría convertida a número:', categoryIdNum);
      
      this.filteredProducts = this.products.filter(p => {
        const productCategoryId = Number(p.categoryId);
        const productState = Number(p.state);
        const match = productCategoryId === categoryIdNum && productState === 1;
        
        console.log(`🔄 SalesTicketForm - Producto ${p.menuId} (${p.name}):`);
        console.log(`  - categoryId original: ${p.categoryId} (${typeof p.categoryId})`);
        console.log(`  - categoryId convertido: ${productCategoryId}`);
        console.log(`  - selectedCategoryId: ${selectedCategoryId} (${typeof selectedCategoryId})`);
        console.log(`  - categoryIdNum: ${categoryIdNum}`);
        console.log(`  - state original: ${p.state} (${typeof p.state})`);
        console.log(`  - state convertido: ${productState}`);
        console.log(`  - match: ${match}`);
        console.log(`  - Comparación categoryId: ${productCategoryId} === ${categoryIdNum} = ${productCategoryId === categoryIdNum}`);
        console.log(`  - Comparación state: ${productState} === 1 = ${productState === 1}`);
        console.log('---');
        
        return match;
      });
      console.log('✅ SalesTicketForm - Productos filtrados por categoría:', this.filteredProducts.length);
      console.log('✅ SalesTicketForm - Productos filtrados:', this.filteredProducts);
    } else {
      this.filteredProducts = [];
    }
  }

  addProductToOrder(): void {
    const selectedProductId = this.salesForm.get('selectedProductId')?.value;
    const selectedQuantity = this.salesForm.get('selectedQuantity')?.value;

    console.log('🔄 SalesTicketForm - Intentando agregar producto al pedido');
    console.log('🔄 SalesTicketForm - selectedProductId:', selectedProductId, typeof selectedProductId);
    console.log('🔄 SalesTicketForm - selectedQuantity:', selectedQuantity, typeof selectedQuantity);
    console.log('🔄 SalesTicketForm - filteredProducts:', this.filteredProducts);

    // Validaciones clásicas
    if (!selectedProductId) {
      this.error = 'Por favor, seleccione un producto';
      this.salesForm.get('selectedProductId')?.markAsTouched();
      return;
    }

    if (!selectedQuantity || selectedQuantity < 1) {
      this.error = 'La cantidad debe ser mayor a 0';
      this.salesForm.get('selectedQuantity')?.markAsTouched();
      return;
    }

    if (selectedQuantity > 100) {
      this.error = 'La cantidad máxima permitida es 100 unidades por producto';
      this.salesForm.get('selectedQuantity')?.markAsTouched();
      return;
    }

    // Validación de negocio: verificar que el producto esté activo
    const product = this.filteredProducts.find(p => {
      const match = p.menuId === Number(selectedProductId);
      return match;
    });

    if (!product) {
      this.error = 'El producto seleccionado no está disponible';
      return;
    }

    if (product.state !== 1) {
      this.error = 'El producto seleccionado no está activo y no puede ser agregado';
      return;
    }

    console.log('🔄 SalesTicketForm - Producto encontrado:', product);

    // Verificar si el producto ya está en el pedido
    const existingItem = this.orderItems.find(item => item.product.menuId === product.menuId);
    console.log('🔄 SalesTicketForm - Item existente:', existingItem);
    
    if (existingItem) {
      existingItem.quantity += selectedQuantity;
      existingItem.subtotal = existingItem.product.price * existingItem.quantity;
      console.log('✅ SalesTicketForm - Cantidad actualizada:', existingItem.quantity);
    } else {
      const newItem = {
        product: product,
        quantity: selectedQuantity,
        subtotal: product.price * selectedQuantity
      };
      this.orderItems.push(newItem);
      console.log('✅ SalesTicketForm - Nuevo producto agregado:', newItem);
    }

    // Limpiar selectores y errores
    this.salesForm.patchValue({ selectedProductId: '', selectedQuantity: 1 });
    this.error = ''; // Limpiar errores previos

    // Actualizar el total en el formulario
    this.updateTotalInForm();
    
    console.log('✅ SalesTicketForm - Producto agregado al pedido:', product.name);
    console.log('✅ SalesTicketForm - Total items en pedido:', this.orderItems.length);
  }

  removeProductFromOrder(index: number): void {
    this.orderItems.splice(index, 1);
    this.updateTotalInForm();
    console.log('✅ Producto eliminado del pedido');
  }

  calculateSubtotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal();
  }

  updateTotalInForm(): void {
    // Ya no es necesario actualizar el campo totalPayment, se muestra automáticamente
    const subtotal = this.calculateTotal();
    const totalWithIGV = this.calculateTotalWithIGV();
    console.log('✅ Subtotal:', subtotal);
    console.log('✅ IGV (18%):', this.calculateIGV());
    console.log('✅ Total con IGV:', totalWithIGV);
  }

  formatCurrency(amount: number): string {
    return this.salesTicketService.formatCurrency(amount);
  }

  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.markFormGroupTouched(this.salesForm);

    // Validaciones clásicas de formulario
    if (this.salesForm.invalid) {
      const firstError = this.getFirstFormError();
      this.error = firstError || 'Por favor, complete todos los campos requeridos correctamente';
      return;
    }

    // Validaciones de negocio
    const businessValidationError = this.validateBusinessRules();
    if (businessValidationError) {
      this.error = businessValidationError;
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = this.salesForm.value;
    const currentUser = this.authService.getCurrentUser();
    
    // Obtener el ID del usuario - usar getIdUser() que es más confiable
    let userId: number = 1; // Valor por defecto
    const storedIdUser = this.authService.getIdUser();
    if (storedIdUser) {
      const parsedId = parseInt(storedIdUser, 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    } else if (currentUser?.id && typeof currentUser.id === 'number') {
      userId = currentUser.id;
    }
    
    // Debug del usuario actual
    console.log('🔍 SalesTicketForm - Usuario actual:', currentUser);
    console.log('🔍 SalesTicketForm - Usuario ID (currentUser?.id):', currentUser?.id);
    console.log('🔍 SalesTicketForm - Usuario ID (getIdUser):', storedIdUser);
    console.log('🔍 SalesTicketForm - Usuario ID final a usar:', userId);
    console.log('🔍 SalesTicketForm - Usuario rol:', currentUser?.role);
    console.log('🔍 SalesTicketForm - Usuario username:', currentUser?.username);
    
    // Verificar token
    const token = localStorage.getItem('jwt_token');
    console.log('🔍 SalesTicketForm - Token presente:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 SalesTicketForm - Token payload:', payload);
        console.log('🔍 SalesTicketForm - Token subject (username):', payload.sub);
        console.log('🔍 SalesTicketForm - Token roles/authorities:', payload.authorities || payload.roles || 'No disponible');
        console.log('🔍 SalesTicketForm - Token expiración:', payload.exp ? new Date(payload.exp * 1000) : 'No disponible');
      } catch (error) {
        console.error('🔍 SalesTicketForm - Error decodificando token:', error);
      }
    }

    // Calcular el total automáticamente
    const totalPayment = this.calculateTotalWithIGV();

    const salesTicketData: SalesTicket = {
      // Si es edición, incluir ticketId, saleDate y state del ticket original
      ...(this.isEdit && this.originalTicket ? {
        ticketId: this.originalTicket.ticketId,
        saleDate: this.originalTicket.saleDate, // Mantener la fecha original
        state: this.originalTicket.state || 'A' // Preservar el estado original (A=Activo, I=Inactivo)
      } : {}),
      totalPayment: totalPayment,
      delivery: formData.delivery,
      deliveryAddress: formData.delivery === 'SI' ? formData.deliveryAddress : '',
      note: formData.note || '',
      userId: userId,
      idPaymentType: formData.idPaymentType,
      idTypeState: formData.idTypeState,
      productDetails: this.orderItems.map(item => ({
        menuId: item.product.menuId,
        menuName: item.product.name,
        menuPrice: item.product.price,
        amount: item.quantity
      }))
    };
    
    console.log('🔄 SalesTicketForm - Datos a enviar:', salesTicketData);
    console.log('🔄 SalesTicketForm - Es edición:', this.isEdit);
    console.log('🔄 SalesTicketForm - Ticket original:', this.originalTicket);

    console.log('🔄 Enviando datos del ticket:', salesTicketData);
    console.log('🔄 SalesTicketForm - URL completa:', `${this.salesTicketService['url']}/api/sales`);

    const operation = this.isEdit 
      ? this.salesTicketService.updateSales(this.salesId!, salesTicketData)
      : this.salesTicketService.createSales(salesTicketData);

    operation.subscribe({
      next: (response) => {
        this.loading = false;
        this.success = this.isEdit ? 'Ticket actualizado exitosamente' : 'Ticket creado exitosamente';
        console.log('✅ Operación exitosa:', response);
        
        // Si no es edición, limpiar el carrito después de crear el ticket
        if (!this.isEdit) {
          this.cartService.clearCart();
          console.log('🛒 Carrito limpiado después de crear el ticket');
        }
        
        // Redirigir después de mostrar la notificación brevemente (1 segundo)
        setTimeout(() => {
          // Si el usuario es CLIENTE y está creando un ticket (no editando), redirigir a mis-compras
          const currentUser = this.authService.getCurrentUser();
          const userRole = currentUser?.role || localStorage.getItem('user_role');
          
          if (!this.isEdit && userRole === 'CLIENTE') {
            this.router.navigate(['/mis-compras']);
          } else {
            // Para ADMIN/EMPLEADO o cuando es edición, redirigir a salesticket
            this.router.navigate(['/salesticket']);
          }
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error en la operación:', error);
        
        // Mensaje de error más específico según el código de estado
        if (error.message && error.message.includes('403')) {
          this.error = 'Acceso denegado: Tu usuario no tiene permisos para crear tickets. El backend está rechazando la operación para usuarios con rol CLIENTE. Por favor, contacta al administrador para que configure los permisos en el backend.';
        } else {
          this.error = error.message || 'Error al procesar el ticket';
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/salesticket']);
  }

  // Helper para convertir a número en el template
  toNumber(value: any): number {
    return Number(value);
  }

  // Calcular IGV (18%)
  calculateIGV(): number {
    const subtotal = this.calculateSubtotal();
    return subtotal * 0.18;
  }

  // Calcular total con IGV
  calculateTotalWithIGV(): number {
    const subtotal = this.calculateSubtotal();
    const igv = this.calculateIGV();
    return subtotal + igv;
  }

  // Métodos helper para validaciones y mensajes de error
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFirstFormError(): string | null {
    for (const key of Object.keys(this.salesForm.controls)) {
      const control = this.salesForm.get(key);
      if (control && control.invalid && control.touched) {
        return this.getFieldError(key);
      }
    }
    return null;
  }

  getFieldError(fieldName: string): string {
    const control = this.salesForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }

    if (errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }

    if (errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} no puede exceder ${errors['maxlength'].requiredLength} caracteres`;
    }

    if (errors['min']) {
      return `${this.getFieldLabel(fieldName)} debe ser mayor o igual a ${errors['min'].min}`;
    }

    if (errors['max']) {
      return `${this.getFieldLabel(fieldName)} no puede ser mayor a ${errors['max'].max}`;
    }

    if (errors['minLength']) {
      return `La dirección debe tener al menos ${errors['minLength'].requiredLength} caracteres`;
    }

    if (errors['invalidAddress']) {
      return errors['invalidAddress'].message || 'La dirección debe contener letras y ser válida';
    }

    if (errors['invalidNote']) {
      return errors['invalidNote'].message || 'Las notas tienen un formato inválido';
    }

    if (errors['pattern']) {
      return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
    }

    return 'Campo inválido';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      delivery: 'Entrega a domicilio',
      deliveryAddress: 'Dirección de entrega',
      note: 'Notas',
      idPaymentType: 'Tipo de pago',
      idTypeState: 'Estado de orden',
      selectedCategoryId: 'Categoría',
      selectedProductId: 'Producto',
      selectedQuantity: 'Cantidad'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.salesForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  // Validaciones de negocio
  validateBusinessRules(): string | null {
    // Validar que haya al menos un producto
    if (this.orderItems.length === 0) {
      return 'Debe agregar al menos un producto al pedido';
    }

    // Validar que todos los productos estén activos
    const inactiveProducts = this.orderItems.filter(item => item.product.state !== 1);
    if (inactiveProducts.length > 0) {
      const productNames = inactiveProducts.map(item => item.product.name).join(', ');
      return `Los siguientes productos no están activos y no pueden ser incluidos: ${productNames}`;
    }

    // Validar total mínimo
    const total = this.calculateTotalWithIGV();
    if (total < 0.01) {
      return 'El total del pedido debe ser mayor a S/ 0.01';
    }

    // Validar que las cantidades sean válidas
    const invalidQuantities = this.orderItems.filter(item => item.quantity < 1 || item.quantity > 100);
    if (invalidQuantities.length > 0) {
      return 'Las cantidades deben estar entre 1 y 100 unidades';
    }

    // Validar que el usuario esté autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return 'Debe estar autenticado para crear un ticket';
    }

    // Validar dirección si es entrega a domicilio
    if (this.salesForm.get('delivery')?.value === 'SI') {
      const address = this.salesForm.get('deliveryAddress')?.value?.trim();
      if (!address || address.length < 10) {
        return 'La dirección de entrega debe tener al menos 10 caracteres';
      }
    }

    return null;
  }

  // Método helper para el template (ya existe pero lo mantenemos)
  onDeliveryChange(): void {
    // Este método se llama cuando cambia el campo delivery
    // La validación condicional ya está manejada en createForm()
  }
}