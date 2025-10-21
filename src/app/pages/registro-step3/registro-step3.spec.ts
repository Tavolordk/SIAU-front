import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep3 } from './registro-step3';

describe('RegistroStep3', () => {
  let component: RegistroStep3;
  let fixture: ComponentFixture<RegistroStep3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep3]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep3);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
