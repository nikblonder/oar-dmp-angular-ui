import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChipsSplitterService {
  private separatorExp: RegExp = /,|;/;

  constructor() { }

  public splitChips(input: String) {
    return input.split(this.separatorExp);
  }
}
