import { Button } from "@components/ui/button"
import {
  Dialog, DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@components/ui/dialog"
import { OpenFileDialog } from "@lib/wailsjs/go/core/Backend"
import { connections } from "@lib/wailsjs/go/models"
import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import { useEventBusListener } from "@hooks/events"
import { AddConnection } from "@store"
import { useTranslation } from "react-i18next"

const CreateConnectionDialog = () => {
  const { t } = useTranslation()
  const [open, onOpenChange] = useState(false)
  const [isChoosingFile, setIsChoosingFile] = useState(false)

  useEventBusListener("connections.create", (initialData?: connections.ConnectionData) => {
    onOpenChange(true)
    if (initialData?.name) {
      form.setValue("name", initialData.name)
    }
  })

  const form = useForm<connections.ConnectionData>({
    defaultValues: {
      type: "postgres",
    }
  })

  const handleBrowseSQliteFiles = async () => {
    setIsChoosingFile(true)
    const path = await OpenFileDialog()

    if (path) {
      form.setValue("db", path)
    }

    setIsChoosingFile(false)
  }

  const onSubmit = async (data: connections.ConnectionData) => {
    if (isChoosingFile) return

    if (data.type !== "sqlite") {
      data.port = parseInt(data.port.toString())
    }
    await AddConnection(data)
    onOpenChange(false)
    form.reset()
  }

  const type = form.watch("type")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px]">
        <DialogHeader>
          <DialogTitle>{t("createConnectionTitle", "New connection")}</DialogTitle>
          <DialogDescription>
            {t("createConnectionDescription", "Create a new connection to a database")}
          </DialogDescription>
        </DialogHeader>

        <Form  {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <div className="flex gap-3 items-center">
                  <div onClick={() => form.setValue("type", "postgres")} className={`cursor-pointer p-2 border rounded ${field.value === "postgres" ? "bg-primary" : ""}`}>
                    Postgres
                  </div>
                  <div onClick={() => form.setValue("type", "mysql")} className={`cursor-pointer p-2 border rounded ${field.value === "mysql" ? "bg-primary" : ""}`}>
                    MySQL
                  </div>
                  <div onClick={() => form.setValue("type", "sqlite")} className={`cursor-pointer p-2 border rounded ${field.value === "sqlite" ? "bg-primary" : ""}`}>
                    SQLite
                  </div>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("connectionName", "Connection name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("exampleConnection", "Example connection")} {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(type === "postgres" || type === "mysql") && (
              <>

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem className="flex-3">
                        <FormLabel>{t("host", "Host")}</FormLabel>
                        <FormControl>
                          <Input placeholder="db.myapp.example" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("port", "Port")}</FormLabel>
                        <FormControl>
                          <Input placeholder={"5432"} {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Username", "Username")}</FormLabel>
                        <FormControl>
                          <Input placeholder={"john"} {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pass"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("Password", "Password")}</FormLabel>
                        <FormControl>
                          <Input placeholder={"*****"} {...field} type="password" />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="db"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("databaseName", "Database name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("myDatabase", "my_database")}  {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </>
            )}

            {(type === "sqlite") && (
              <FormField
                control={form.control}
                name="db"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("path", "Path")}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input placeholder={t("pathToDatabase", "Path to database")} {...field} className="flex-1" />
                        <Button variant="outline" size="sm" onClick={handleBrowseSQliteFiles}>Browse</Button>
                      </div>

                    </FormControl>
                    <FormDescription>
                      This is the path to your SQLite database.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>{t("testAndAddConnection", "Test and add connection")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >

  )
}

export default CreateConnectionDialog