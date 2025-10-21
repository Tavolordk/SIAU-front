import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultarCedulas } from './consultar-cedulas';

describe('ConsultarCedulas', () => {
  let component: ConsultarCedulas;
  let fixture: ComponentFixture<ConsultarCedulas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarCedulas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultarCedulas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
