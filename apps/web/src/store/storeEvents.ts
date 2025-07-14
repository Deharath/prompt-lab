type StoreEventHandler = (event: string, data: any) => void;

class StoreEventBus {
  private handlers = new Map<string, StoreEventHandler[]>();

  on(event: string, handler: StoreEventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  emit(event: string, data: any): void {
    const eventHandlers = this.handlers.get(event) || [];
    eventHandlers.forEach((handler) => handler(event, data));
  }

  off(event: string, handler: StoreEventHandler): void {
    const eventHandlers = this.handlers.get(event) || [];
    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  }
}

export const storeEventBus = new StoreEventBus();
