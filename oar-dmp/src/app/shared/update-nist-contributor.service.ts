import { Injectable } from '@angular/core';
//for sending messages between unrelated components
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateNistContributorService {

  constructor() { 
    this.updateContributors = false;
  }

  updateContributors:boolean;
  updateNISTContrib$ = new Subject<boolean>();

}
