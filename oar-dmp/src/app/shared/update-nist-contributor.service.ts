import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

import { UpdateIndicator } from '../types/update-indicator.type';

@Injectable({
  providedIn: 'root'
})

export class UpdateNistContributorService {
 
  constructor() { 
    this.updateContributors = {numUpdates:0, isUpdated:false};
  }

  updateContributors:UpdateIndicator;
  updateNISTContrib$ = new Subject<UpdateIndicator>();

}
