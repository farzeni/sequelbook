
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog"
import { useEventBus } from "@hooks/events"
import { appState } from "@hooks/store"
import { SetBookConnection } from "@store"
import { FC, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"

interface ConnectionSwitcherProps {
  bookId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const ConnectionSwitcher: FC<ConnectionSwitcherProps> = ({ bookId, isOpen, onOpenChange }) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")
  const connections = useSnapshot(appState.connections)
  const events = useEventBus()

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onOpenChange(false)
    }

    if (e.key === "Enter" && filteredConnections.length === 0) {
      if (inputRef.current) {
        setInputValue(inputRef.current.value)
      }

      events.emit("connections.create", {
        name: inputValue,
        host: "",
        port: 5432,
        user: "",
        pass: "",
        db: "",
        type: "postgres"
      })

      onOpenChange(false)
      e.preventDefault()
    }
  }

  async function handleSelectConnection(connectionId: string) {
    console.log("ConnectionSwitcher: handleSelectConnection", connectionId)
    await SetBookConnection(bookId, connectionId)
    onOpenChange(false)
  }

  const filteredConnections = useMemo(() =>
    Object.values(connections).filter((connection) =>
      connection.name.toLowerCase().includes(inputValue.toLowerCase())
    ), [connections, inputValue])



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0" aria-labelledby="switch-connection-dialog">
        <DialogTitle>{t("switchConnection", "Switch Connection")}</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">

          <CommandInput
            ref={inputRef}
            placeholder={t("typeConnectionOrSearch", "Type a connection name or search...")}
            onKeyDown={handleKeyDown}
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
          />
          <CommandList >
            <CommandEmpty>{t("Type a connection name a press Enter to create new connection")}</CommandEmpty>
            {filteredConnections.length > 0 && (
              <CommandGroup heading={t("Connections", "Connections")}>
                {filteredConnections.map((connection) => (
                  <CommandItem key={connection.id} onSelect={() => handleSelectConnection(connection.id)} value={connection.name}>
                    <span>{connection.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}


export default ConnectionSwitcher