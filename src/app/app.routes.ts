import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoriasComponent } from './pages/categorias/categorias.component';
import { CategoriaDetailComponent } from './pages/categoria-detail/categoria-detail.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'categorias', component: CategoriasComponent },
  { path: 'categoria/:id', component: CategoriaDetailComponent },
  { path: '**', redirectTo: '' }
];
