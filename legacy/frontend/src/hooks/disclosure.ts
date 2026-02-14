import { useCallback, useState } from "react"

const useDisclosure = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const onClose = useCallback(() => setIsOpen(false), [])
  const onOpen = useCallback(() => setIsOpen(true), [])
  const onToggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), [])

  return { isOpen, onClose, onOpen, onToggle, onOpenChange }
}

export default useDisclosure
