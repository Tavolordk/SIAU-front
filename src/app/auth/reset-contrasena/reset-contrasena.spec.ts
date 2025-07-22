import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetContrasena } from './reset-contrasena';

describe('ResetContrasena', () => {
  let component: ResetContrasena;
  let fixture: ComponentFixture<ResetContrasena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetContrasena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetContrasena);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
