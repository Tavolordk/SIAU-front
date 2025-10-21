import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep4 } from './registro-step4';

describe('RegistroStep4', () => {
  let component: RegistroStep4;
  let fixture: ComponentFixture<RegistroStep4>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep4]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep4);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
