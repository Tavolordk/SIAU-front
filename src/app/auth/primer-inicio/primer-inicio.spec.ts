import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimerInicio } from './primer-inicio';

describe('PrimerInicio', () => {
  let component: PrimerInicio;
  let fixture: ComponentFixture<PrimerInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimerInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimerInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
