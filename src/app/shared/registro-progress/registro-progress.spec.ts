import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroProgress } from './registro-progress';

describe('RegistroProgress', () => {
  let component: RegistroProgress;
  let fixture: ComponentFixture<RegistroProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
