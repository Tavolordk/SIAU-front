import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlvidoContrasena } from './olvido-contrasena';

describe('OlvidoContrasena', () => {
  let component: OlvidoContrasena;
  let fixture: ComponentFixture<OlvidoContrasena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlvidoContrasena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlvidoContrasena);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
