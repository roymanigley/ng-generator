import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetterSetterComponent } from './generators/getter-setter/getter-setter.component';

const routes: Routes = [
  { path : 'entity', component: GetterSetterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash:true,
    anchorScrolling: 'enabled',})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
