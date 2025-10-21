import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroStep1V2 } from './registro-step1-v2';

describe('RegistroStep1V2', () => {
  let component: RegistroStep1V2;
  let fixture: ComponentFixture<RegistroStep1V2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroStep1V2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroStep1V2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
