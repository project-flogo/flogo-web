import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationControlsComponent } from './simulation-controls.component';

describe('SimulationControlsComponent', () => {
  let component: SimulationControlsComponent;
  let fixture: ComponentFixture<SimulationControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SimulationControlsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimulationControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
