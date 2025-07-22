import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaUsuario } from './carga-usuario';

describe('CargaUsuario', () => {
  let component: CargaUsuario;
  let fixture: ComponentFixture<CargaUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargaUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
