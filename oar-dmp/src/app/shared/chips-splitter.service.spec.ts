import { TestBed } from '@angular/core/testing';

import { ChipsSplitterService } from './chips-splitter.service';

describe('ChipsSplitterService', () => {
  let service: ChipsSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChipsSplitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
