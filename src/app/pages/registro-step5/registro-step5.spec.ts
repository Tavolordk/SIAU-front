import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep5 } from './registro-step5';

describe('RegistroStep5', () => {
  let component: RegistroStep5;
  let fixture: ComponentFixture<RegistroStep5>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep5]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep5);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
