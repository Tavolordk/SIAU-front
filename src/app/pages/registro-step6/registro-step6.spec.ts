import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep6 } from './registro-step6';

describe('RegistroStep6', () => {
  let component: RegistroStep6;
  let fixture: ComponentFixture<RegistroStep6>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep6]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep6);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
