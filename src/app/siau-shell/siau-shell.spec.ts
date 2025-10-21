import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiauShell } from './siau-shell';

describe('SiauShell', () => {
  let component: SiauShell;
  let fixture: ComponentFixture<SiauShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiauShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiauShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
