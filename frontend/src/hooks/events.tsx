import { AppEvents, eventBus, EventBus } from "@store/events"
import React, { createContext, useContext, useEffect } from "react"

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
