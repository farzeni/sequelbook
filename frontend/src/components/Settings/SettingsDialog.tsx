import {
  Button,
  Dialog,
  Field,
  Flex,
  Input,
  NativeSelect,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { useEffect, useState } from "react"
import { LuX } from "react-icons/lu"
import { useColorMode } from "@/components/ui/color-mode"
import { settingsAtom, saveSettingsAtom } from "@/store"

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const settings = useAtomValue(settingsAtom)
  const saveSettings = useSetAtom(saveSettingsAtom)
  const { colorMode, setColorMode } = useColorMode()

  const [pageSize, setPageSize] = useState(String(settings.pageSize))
  const [theme, setTheme] = useState<string>(colorMode)
  const [fontSize, setFontSize] = useState(String(settings.fontSize ?? 14))

  // Sync form state when dialog opens
  useEffect(() => {
    if (open) {
      setPageSize(String(settings.pageSize))
      setTheme(colorMode)
      setFontSize(String(settings.fontSize ?? 14))
    }
  }, [open, settings.pageSize, settings.fontSize, colorMode])

  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open) onClose()
  }

  function handleSave() {
    const parsed = parseInt(pageSize, 10)
    const validPageSize = !isNaN(parsed) && parsed > 0 ? parsed : 50
    const parsedFontSize = parseInt(fontSize, 10)
    const validFontSize = Math.min(
      24,
      Math.max(10, !isNaN(parsedFontSize) && parsedFontSize > 0 ? parsedFontSize : 14)
    )
    saveSettings({ pageSize: validPageSize, fontSize: validFontSize })
    // next-themes setTheme accepts "system" but the typed wrapper restricts to ColorMode
    ;(setColorMode as (mode: string) => void)(theme)
    onClose()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
      size="sm"
      motionPreset="slide-in-bottom"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Close">
                <LuX />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body>
            <Stack gap={5}>
              {/* General section */}
              <Stack gap={3}>
                <Text fontWeight="semibold" fontSize="sm">General</Text>
                <Field.Root>
                  <Field.Label>Page size</Field.Label>
                  <Input
                    type="number"
                    min={1}
                    max={10000}
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                  />
                  <Field.HelperText>
                    Number of rows per query result page
                  </Field.HelperText>
                </Field.Root>
              </Stack>

              <Separator />

              {/* Appearance section */}
              <Stack gap={3}>
                <Text fontWeight="semibold" fontSize="sm">Appearance</Text>
                <Field.Root>
                  <Field.Label>Theme</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Font size</Field.Label>
                  <Input
                    type="number"
                    min={10}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  />
                  <Field.HelperText>
                    Base font size in pixels (10–24). Use Ctrl+= and Ctrl+- to zoom.
                  </Field.HelperText>
                </Field.Root>
              </Stack>
            </Stack>
          </Dialog.Body>

          <Dialog.Footer>
            <Flex gap={2} justify="flex-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="solid"
                colorPalette="blue"
                size="sm"
                onClick={handleSave}
              >
                Save
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
