import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DmpFormComponent } from '../dmp-form/dmp-form.component';
import { PageNotFoundComponent } from '../page-not-found/page-not-found.component';
import { PageDmpPublishedComponent } from '../page-dmp-published/page-dmp-published.component';
import { PageErrorComponent } from '../page-error/page-error.component';

const routes: Routes = [
  { path: 'new', component: DmpFormComponent, data: {action:"new"} },
  // { path: 'edit', component: DmpFormComponent, data: {action:"edit"} },
  { path: 'edit/:id', component: DmpFormComponent, data: {action:"edit"} },
  { path: 'error', component: PageErrorComponent },
  { path: 'success', component: PageDmpPublishedComponent },
  { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation:'reload'})],
  // use reload to Refetch data on same URL navigation
  // this is used to reload saved draft from dmp which enables for 
  // metadata that are lists to be properly saved and updated
  exports: [RouterModule]
})
export class DmpRoutingModule { }
