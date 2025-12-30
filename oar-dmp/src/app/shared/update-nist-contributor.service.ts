import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

import { UpdateIndicator } from '../types/update-indicator.type';

@Injectable({
  providedIn: 'root'
})


// TODO: see if you can set up an interface and have two variables - one that counts how many contributors have changed and second boolean to indicate if any of contributors have been modified
// then display alert only once instead for every contributor that has been updated - so don't put alert if count is greater than 1
export class UpdateNistContributorService {
 
  constructor() { 
    this.updateContributors = {numUpdates:0, isUpdated:false};
  }

  updateContributors:UpdateIndicator;
  updateNISTContrib$ = new Subject<UpdateIndicator>();

}
