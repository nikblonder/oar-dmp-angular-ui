import { TestBed } from '@angular/core/testing';

import { UpdateNistContributorService } from './update-nist-contributor.service';

describe('UpdateNistContributorService', () => {
  let service: UpdateNistContributorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateNistContributorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
