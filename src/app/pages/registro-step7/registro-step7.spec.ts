import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep7 } from './registro-step7';

describe('RegistroStep7', () => {
  let component: RegistroStep7;
  let fixture: ComponentFixture<RegistroStep7>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep7]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep7);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
