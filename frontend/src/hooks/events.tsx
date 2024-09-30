import { connections } from "@lib/wailsjs/go/models"
import React, { createContext, useContext, useEffect } from "react"



type AppEvents = {
  "sidebar.item.rename": (id: string) => void,
  "connections.create": (data?: connections.ConnectionData) => void
  "connections.pick": () => void
}

type EventCallback<T = any> = (...args: T[]) => void

class EventBus {
  private events: Map<keyof AppEvents, Set<EventCallback>> = new Map()

  subscribe(event: keyof AppEvents, callback: AppEvents[typeof event]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)?.add(callback)
    console.log(`Subscribed to ${String(event)}`)
  }

  unsubscribe(event: keyof AppEvents, callback: AppEvents[typeof event]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      console.log(`Unsubscribed from ${String(event)}`)
    }
  }

  emit(
    event: keyof AppEvents,
    ...args: Parameters<AppEvents[typeof event]>
  ): void {
    console.log(`Emitting event ${String(event)}`, args)
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

const eventBus = new EventBus()

const EventBusContext = createContext<EventBus | null>(null)

export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <EventBusContext.Provider value={eventBus}>
      {children}
    </EventBusContext.Provider>
  )
}

export const useEventBus = (): EventBus => {
  const context = useContext(EventBusContext)
  if (!context) {
    throw new Error("useEventBus must be used within an EventBusProvider")
  }
  return context
}

export function useEventBusListener<K extends keyof AppEvents>(
  event: K,
  callback: AppEvents[K]
): void {
  const eventBus = useEventBus()

  useEffect(() => {
    eventBus.subscribe(event, callback)

    return () => {
      eventBus.unsubscribe(event, callback)
    }
  }, [eventBus, event, callback])
}
