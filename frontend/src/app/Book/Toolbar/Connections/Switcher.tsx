
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@components/ui/command"
import useDisclosure from "@hooks/disclosure"
import { SetSelectedConnection, useStore } from "@hooks/store"
import { FC, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import CreateConnectionDialog from "./CreateConnection"

interface ConnectionSwitcherProps {
  bookId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const ConnectionSwitcher: FC<ConnectionSwitcherProps> = ({ bookId, isOpen, onOpenChange }) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")

  const dialogDisclose = useDisclosure()

  const connections = useStore((state) => state.connections)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onOpenChange(false)
    }

    if (e.key === "Enter") {
      if (inputRef.current) {
        setInputValue(inputRef.current.value)
      }

      dialogDisclose.onOpen()
      onOpenChange(false)
    }
  }

  async function handleSelectConnection(connectionId: string) {
    console.log("!")
    await SetSelectedConnection(bookId, connectionId)
    onOpenChange(false)
    console.log("!2")

  }


  return (
    <>
      <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
        <CommandInput
          ref={inputRef}
          placeholder={t("typeCommandOrSearch", "Type a command or search...")}
          onKeyDown={handleKeyDown}
          value={inputValue}
          onValueChange={(value) => setInputValue(value)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={t("Connections", "Connections")}>
            {Object.values(connections).map((connection) => (
              <CommandItem key={connection.id} onSelect={() => handleSelectConnection(connection.id)} value={connection.id}>
                <span>{connection.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

        </CommandList>
      </CommandDialog>
      <CreateConnectionDialog open={dialogDisclose.isOpen} onOpenChange={dialogDisclose.onOpenChange}
        initialData={{
          name: inputValue,
          host: "",
          port: 5432,
          user: "",
          pass: "",
          db: "",
          type: "postgres"

        }} />
    </>
  )
}


export default ConnectionSwitcher