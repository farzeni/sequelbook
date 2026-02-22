import { Text } from "@chakra-ui/react"
import { FC, useMemo } from "react"
import { getActionKeybinding } from "./keymap"
import type { KeyCombo } from "./types"
import { formatShortcut } from "./utils"

interface ShortcutLabelProps {
  /** Either a raw key combo string or an action ID to look up. */
  actionId?: string
  combo?: KeyCombo
  fontSize?: string
}

/**
 * Renders a platform-appropriate keyboard shortcut label.
 * Pass either `actionId` (resolved from the registry) or a raw `combo` string.
 */
const ShortcutLabel: FC<ShortcutLabelProps> = ({ actionId, combo, fontSize = "xs" }) => {
  const display = useMemo(() => {
    const raw = combo ?? (actionId ? getActionKeybinding(actionId) : null)
    if (!raw) return null
    return formatShortcut(raw)
  }, [actionId, combo])

  if (!display) return null

  return (
    <Text
      as="span"
      fontSize={fontSize}
      color="fg.subtle"
      fontFamily="mono"
      whiteSpace="nowrap"
      userSelect="none"
    >
      {display}
    </Text>
  )
}

export default ShortcutLabel
