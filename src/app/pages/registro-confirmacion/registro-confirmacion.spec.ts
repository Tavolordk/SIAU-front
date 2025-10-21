import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroConfirmacion } from './registro-confirmacion';

describe('RegistroConfirmacion', () => {
  let component: RegistroConfirmacion;
  let fixture: ComponentFixture<RegistroConfirmacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroConfirmacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroConfirmacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
