import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet"
import { useEventBus } from "@hooks/events"
import { appState } from "@hooks/store"
import { runners } from "@lib/wailsjs/go/models"
import { AddRow, GetColumns } from "@lib/wailsjs/go/runners/Pooler"
import { DatabaseTab } from "@store"
import { FC, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"

interface AddRowSheetProps {
  tab: DatabaseTab
  children?: React.ReactNode
  onRowAdded?: () => void
}

const AddRowSheet: FC<AddRowSheetProps> = ({ tab, children, onRowAdded }) => {
  const { t } = useTranslation()
  const [columns, setColumns] = useState<runners.ColumnDef[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const events = useEventBus()

  const { control, setError, handleSubmit, formState: { touchedFields, errors } } = useForm();

  const connection = useSnapshot(appState.connections[tab.connectionId])

  const onSubmit = async (data: any) => {
    if (!tab.table) {
      return
    }

    const filteredData = columns.reduce((acc, field) => {
      const value = data[field.column_name];

      if (value === '' && !field.is_nullable && field.column_default === null) {
        setError(field.column_name, { message: `${field.column_name} is required` });
      }

      if (touchedFields[field.column_name]) {
        if (value === '' && field.is_nullable) {
          acc[field.column_name] = null;
        } else {
          switch (field.data_type) {
            case 'bigint':
            case 'integer':
            case 'smallint':
            case 'numeric':
              acc[field.column_name] = Number(value);
              break;
            case 'text':
            case 'character varying':
            case 'character':
              acc[field.column_name] = value;
              break;
            case 'boolean':
              acc[field.column_name] = !!value && value !== '';
              break;
            case 'date':
            case 'timestamp':
            case 'timestamp with time zone':
              acc[field.column_name] = new Date(value).toISOString();
              break;



            default:
          }
          acc[field.column_name] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    console.log(data)
    console.log(filteredData)

    try {
      await AddRow(connection, tab.table, filteredData)
      onRowAdded && onRowAdded()
      events.emit("connection.table.refresh", tab.connectionId, tab.table)
      setIsOpen(false)
    } catch (e: any) {
      console.error(e.toString())
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!tab.table) {
        return
      }

      try {
        const r = await GetColumns(connection, tab.table)
        if (r) {
          setColumns(r.columns)
        }
      } catch (e: any) {
        console.error(e.toString())
      }
    }

    fetchData()
  }, [tab.connectionId, tab.table])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent size="lg" className="overflow-auto">
        <SheetHeader>
          <SheetTitle>{t("Add new row")}</SheetTitle>
          <SheetDescription>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col items-start gap-2">
                {columns.map((field) => (
                  <div key={field.column_name} className="flex-1 w-full">
                    <label>
                      {field.column_name}
                      {!field.is_nullable && !field.column_default ? ' *' : ''}
                    </label>
                    <Controller
                      name={field.column_name}
                      control={control}
                      defaultValue={field.data_type === 'checkbox' ? false : ''}
                      render={({ field: { onChange, onBlur, value, ref } }) => {
                        switch (field.data_type) {
                          case 'text':
                            return <Input type="text" onChange={onChange} onBlur={onBlur} ref={ref} value={value} required={!field.is_nullable && !field.column_default} />;
                          case 'number':
                            return <Input type="number" onChange={onChange} onBlur={onBlur} ref={ref} value={value} required={!field.is_nullable && !field.column_default} />;
                          case 'checkbox':
                            return <Input type="checkbox" onChange={onChange} onBlur={onBlur} ref={ref} checked={value} required={!field.is_nullable && !field.column_default} />;
                          default:
                            return <Input type="text" onChange={onChange} onBlur={onBlur} ref={ref} value={value} required={!field.is_nullable && !field.column_default} />;
                        }
                      }}
                    />
                    {/* {errors[field.column_name]?.message && <span>{errors[field.column_name]?.message}</span>} */}
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" type="submit">{t("addRow", "Add Row")}</Button>
            </form>

          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}

export default AddRowSheet