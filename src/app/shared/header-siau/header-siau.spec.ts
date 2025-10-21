import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderSiauComponent } from './header-siau';

describe('HeaderSiau', () => {
  let component: HeaderSiauComponent;
  let fixture: ComponentFixture<HeaderSiauComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSiauComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderSiauComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
