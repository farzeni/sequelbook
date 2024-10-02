import { connections } from "@lib/wailsjs/go/models"

export type AppEvents = {
  "sidebar.item.rename": (id: string) => void

  "connections.create": (data?: connections.ConnectionData) => void
  "connections.pick": () => void
}

export type EventCallback<T = any> = (...args: T[]) => void

export class EventBus {
  private events: Map<keyof AppEvents, Set<EventCallback>> = new Map()

  subscribe(event: keyof AppEvents, callback: AppEvents[typeof event]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)?.add(callback)
  }

  unsubscribe(event: keyof AppEvents, callback: AppEvents[typeof event]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  emit(
    event: keyof AppEvents,
    ...args: Parameters<AppEvents[typeof event]>
  ): void {
    this.events.get(event)?.forEach((callback) => {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event callback for ${String(event)}:`, error)
      }
    })
  }

  monitorSubscribers(): void {
    this.events.forEach((callbacks, event) => {
      console.log(`Event: ${String(event)}, Subscribers: ${callbacks.size}`)
    })
  }
}

export const eventBus = new EventBus()
