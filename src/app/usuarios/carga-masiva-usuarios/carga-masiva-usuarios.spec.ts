import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaMasivaUsuarios } from './carga-masiva-usuarios';

describe('CargaMasivaUsuarios', () => {
  let component: CargaMasivaUsuarios;
  let fixture: ComponentFixture<CargaMasivaUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaMasivaUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargaMasivaUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
