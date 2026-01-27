import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentBrowser } from './equipment-browser';

describe('EquipmentBrowser', () => {
  let component: EquipmentBrowser;
  let fixture: ComponentFixture<EquipmentBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentBrowser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentBrowser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
