import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep2 } from './registro-step2';

describe('RegistroStep2', () => {
  let component: RegistroStep2;
  let fixture: ComponentFixture<RegistroStep2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
