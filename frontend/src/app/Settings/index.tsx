import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useEventBusListener } from "@hooks/events";
import { cn } from "@lib/utils";
import { LoadSettings, SaveSettings } from "@lib/wailsjs/go/core/Backend";
import { core } from "@lib/wailsjs/go/models";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type SettingsSection = "general" | "appearance" | "editor"

const SettingsDialog = () => {
  const [isOpen, setOpen] = useState(false)
  const { t } = useTranslation()
  const [section, setSection] = useState<SettingsSection>("general")

  const { setValue, watch, control } = useForm<core.Settings>()

  useEffect(() => {
    async function load() {
      try {

        const settings = await LoadSettings()
        console.log("SettingsDialog:load", settings)

        if (settings) {
          for (const key in settings) {
            setValue(key as keyof core.Settings, settings[key as keyof core.Settings]?.toString() || "")
          }
        }
      } catch (e: any) {
        console.error("Failed to load settings", e)
      }
    }
    if (isOpen) {
      console.log("SettingsDialog:useEffect")
      load()
    }

  }, [isOpen])

  useEventBusListener("settings.toggle", () => {
    setOpen(!isOpen)
  })

  async function save(data: core.Settings) {
    console.log("SettingsDialog:save", data)

    try {
      await SaveSettings(data)
    } catch (e: any) {
      console.error("Failed to save settings", e)
    }
  }

  const values = watch()

  useEffect(() => {
    console.log("SettingsDialog:watch", values)
    save(values)
  }, [values])

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTitle />
      <DialogContent className="md:max-w-[70%] p-0 flex min-h-[50%]" aria-describedby="settings">

        <div className="w-[200px] bg-background-dark rounded-l p-4">
          <div className="text-xs pl-2 font-bold text-secondary-foreground ">{t("settings", "Settings")}</div>

          <div className="flex flex-col gap-2 mt-4">
            <div
              onClick={() => setSection("general")}
              className={cn(
                section === "general" && "bg-primary !text-primary-foreground",
                "text-left cursor-pointer text-sm w-full text-foreground rounded px-2")}>{t("general", "General")}</div>
            <div
              onClick={() => setSection("editor")}
              className={cn(
                section === "editor" && "bg-primary !text-primary-foreground",
                "text-left cursor-pointer text-sm w-full text-foreground rounded px-2")}>{t("editor", "Editor")}</div>
            <div
              onClick={() => setSection("appearance")}
              className={cn(
                section === "appearance" && "bg-primary !text-primary-foreground",
                "text-left cursor-pointer text-sm w-full text-foreground rounded px-2")}>{t("appearance", "Appearance")}</div>
          </div>
        </div>
        <div className="flex-1 p-4 rounded-r text-foreground">
          {section === "general" && (
            <div>
              <h1 className="text-xl border-b pb-2">{t("general", "General")}</h1>
            </div>
          )}

          {section === "appearance" && (
            <div>
              <h1 className="text-xl border-b pb-2">{t("appearance", "Appearance")}</h1>
              <div className="flex items-center justify-between gap-2 mt-4">
                <div>
                  <div>{t("colorScheme", "Color Scheme")}</div>
                  <div className="text-xs font-thin">{t("colorSchemeMessage", "Choose SequelBook color scheme")}</div>
                </div>
                <Controller
                  control={control}
                  name="theme"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("selectColorScheme", "Select Color Scheme")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("light", "Light")}</SelectItem>
                        <SelectItem value="dark">{t("dark", "Dark")}</SelectItem>
                        <SelectItem value="system">{t("system", "System")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

              </div>
            </div>
          )}

          {section === "editor" && (
            <div>
              <h1 className="text-xl border-b pb-2">{t("editor", "Editor")}</h1>


            </div>
          )}

        </div>

      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog;