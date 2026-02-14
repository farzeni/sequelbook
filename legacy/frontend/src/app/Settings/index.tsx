import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventBusListener } from "@hooks/events";
import { Theme, useTheme } from "@hooks/theme";
import { cn } from "@lib/utils";
import { LoadSettings, SaveSettings } from "@lib/wailsjs/go/core/Backend";
import { core } from "@lib/wailsjs/go/models";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
type SettingsSection = "general" | "appearance" | "editor"

const schema = z.object({
  version: z.string(),
  focus_new_tabs: z.boolean(),
  confirm_file_deletion: z.boolean(),
  deleted_files: z.string(),
  theme: z.string(),
  accent_color: z.string().nullable(),
  zoom_level: z.number().nullable(),
});

type SettingsData = z.infer<typeof schema>;

const SettingsDialog = () => {
  const [isOpen, setOpen] = useState(false)
  const { t } = useTranslation()
  const [section, setSection] = useState<SettingsSection>("general")
  const { theme, setTheme } = useTheme()

  const { setValue, watch, control } = useForm<SettingsData>({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    async function load() {
      try {

        const settings = await LoadSettings()
        console.log("SettingsDialog:load", settings)

        if (settings) {
          for (const key in settings) {
            console.log("SettingsDialog:load set", key, " = ", settings[key as keyof core.Settings])
            setValue(key as keyof SettingsData, settings[key as keyof core.Settings] || "")
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
      console.log(data)
      if (!data.zoom_level) {

        data.zoom_level = 0
      }

      await SaveSettings(data)

      if (theme !== data.theme) {
        setTheme(data.theme as Theme)
      }

    } catch (e: any) {
      console.error("Failed to save settings", e)
    }
  }

  const values = watch()

  console.log("settings =>>>>>", values)


  useEffect(() => {
    console.log("SettingsDialog:watch", values)
    if (values.version && values.version !== "") {

      save(core.Settings.createFrom(values))
    }
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