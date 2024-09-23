import { Button } from "@components/ui/button"
import {
  Dialog, DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@components/ui/dialog"
import { connections } from "@lib/wailsjs/go/models"
import { FC, useEffect } from "react"
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
import { AddConnection } from "@hooks/store"
import { useTranslation } from "react-i18next"

interface CreateConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: connections.ConnectionData
}

const CreateConnectionDialog: FC<CreateConnectionDialogProps> = ({ open, onOpenChange, initialData }) => {
  const { t } = useTranslation()
  const form = useForm<connections.ConnectionData>({
    defaultValues: {
      ...initialData,
      type: "postgres",
    }
  })

  const onSubmit = async (data: connections.ConnectionData) => {
    console.log(data)

    data.port = parseInt(data.port.toString())
    await AddConnection(data)
    onOpenChange(false)
    form.reset()
  }

  useEffect(() => {
    if (initialData?.name) {
      form.setValue("name", initialData.name)
    }
  }, [initialData?.name])

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
              name="name"
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
                      <Input placeholder={"*****"} {...field} />
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
                    <Input placeholder={t("myDatabase", "my_database")}  {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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