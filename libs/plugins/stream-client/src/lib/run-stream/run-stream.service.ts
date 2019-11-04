import { Injectable, ElementRef, Injector } from '@angular/core';
import { PortalInjector, ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';

@Injectable()
export class RunStreamService {
  private overlayRef: OverlayRef;

  constructor(private overlay: Overlay, private injector: Injector) {}

  openPopover<T>(
    connectedToRef: ElementRef,
    contentComponent: ComponentType<T>,
    customTokens?: WeakMap<any, any>
  ) {
    this.overlayRef = this.createPopoverOverlay(connectedToRef);
    this.buildAndAttach(this.overlayRef, contentComponent, customTokens);
  }

  private buildAndAttach<T>(
    overlayRef: OverlayRef,
    contentComponent: ComponentType<T>,
    customTokens?: WeakMap<any, any>
  ) {
    const portal = this.createPortal(contentComponent, customTokens);
    overlayRef.attach(portal);
    overlayRef.backdropClick().subscribe(() => this.closePopover());
  }

  private createPortal<T>(
    componentType: ComponentType<T>,
    customTokens: WeakMap<any, any>
  ) {
    const injector = this.createInjector(customTokens);
    return new ComponentPortal(componentType, null, injector);
  }

  private createInjector(customTokens: WeakMap<any, any>): PortalInjector {
    const injectionTokens = customTokens || new WeakMap<any, any>();
    return new PortalInjector(this.injector, injectionTokens);
  }

  private createPopoverOverlay(connectedToRef: ElementRef) {
    return this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'transparent',
      positionStrategy: this.getPopoverPositionStrategy(connectedToRef),
    });
  }

  private getPopoverPositionStrategy(connectedToRef: ElementRef) {
    return this.overlay
      .position()
      .flexibleConnectedTo(connectedToRef)
      .withPositions([
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 90,
          offsetY: -32,
        },
      ]);
  }

  closePopover() {
    this.overlayRef.dispose();
  }
}
