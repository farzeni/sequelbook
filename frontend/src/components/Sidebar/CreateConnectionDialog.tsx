import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Grid,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { useEffect, useState } from "react"
import { LuX } from "react-icons/lu"
import * as ConnectionService from "@/bindings/github.com/sequelbook/sequelbook/bindings/connectionservice"
import { SSHAuthMethod, SSHTunnelConfig } from "@/bindings/github.com/sequelbook/sequelbook/core/connection/models"
import type { ConnectionEntry } from "@/bindings/github.com/sequelbook/sequelbook/core/settings/models"
import { toaster } from "@/components/ui/toaster"
import { addConnectionAtom, connectAtom } from "@/store"

type DBType = "postgres" | "mysql" | "sqlite"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  type: DBType
  name: string
  host: string
  port: string
  database: string
  user: string
  password: string
  sslMode: string
  // SSH tunnel fields
  sshEnabled: boolean
  sshHost: string
  sshPort: string
  sshUser: string
  sshAuthMethod: SSHAuthMethod
  sshPrivateKey: string
  sshPassphrase: string
  sshPassword: string
  sshRemoteHost: string
  sshRemotePort: string
}

const DEFAULT_PORTS: Record<DBType, string> = {
  postgres: "5432",
  mysql: "3306",
  sqlite: "",
}

const EMPTY_FORM: FormState = {
  type: "postgres",
  name: "",
  host: "localhost",
  port: "5432",
  database: "",
  user: "",
  password: "",
  sslMode: "disable",
  sshEnabled: false,
  sshHost: "",
  sshPort: "22",
  sshUser: "",
  sshAuthMethod: SSHAuthMethod.SSHAuthKey,
  sshPrivateKey: "~/.ssh/id_ed25519",
  sshPassphrase: "",
  sshPassword: "",
  sshRemoteHost: "",
  sshRemotePort: "",
}

function entryToForm(entry: ConnectionEntry): FormState {
  const type = (entry.type || "postgres") as DBType
  const port = entry.port ? String(entry.port) : DEFAULT_PORTS[type]
  const ssh = entry.ssh
  return {
    type,
    name: entry.name,
    host: entry.host,
    port,
    database: entry.database,
    user: entry.user,
    password: entry.password,
    sslMode: entry.sslMode || "disable",
    sshEnabled: !!ssh,
    sshHost: ssh?.host ?? "",
    sshPort: ssh?.port ? String(ssh.port) : "22",
    sshUser: ssh?.user ?? "",
    sshAuthMethod: ssh?.authMethod || SSHAuthMethod.SSHAuthKey,
    sshPrivateKey: ssh?.privateKey ?? "~/.ssh/id_ed25519",
    sshPassphrase: ssh?.passphrase ?? "",
    sshPassword: ssh?.password ?? "",
    sshRemoteHost: ssh?.remoteHost ?? "",
    sshRemotePort: ssh?.remotePort ? String(ssh.remotePort) : "",
  }
}

function buildSSHConfig(form: FormState): SSHTunnelConfig | undefined {
  if (!form.sshEnabled || form.type === "sqlite") return undefined
  const dbPort = parseInt(form.port, 10) || parseInt(DEFAULT_PORTS[form.type], 10)
  return new SSHTunnelConfig({
    host: form.sshHost.trim(),
    port: parseInt(form.sshPort, 10) || 22,
    user: form.sshUser.trim(),
    authMethod: form.sshAuthMethod,
    privateKey: form.sshAuthMethod === SSHAuthMethod.SSHAuthKey ? form.sshPrivateKey.trim() : "",
    passphrase: form.sshAuthMethod === SSHAuthMethod.SSHAuthKey ? form.sshPassphrase : "",
    password: form.sshAuthMethod === SSHAuthMethod.SSHAuthPassword ? form.sshPassword : "",
    remoteHost: form.sshRemoteHost.trim() || form.host.trim(),
    remotePort: parseInt(form.sshRemotePort, 10) || dbPort,
  })
}

function formToEntry(form: FormState, id = ""): ConnectionEntry {
  const port = form.type === "sqlite" ? 0 : parseInt(form.port, 10) || parseInt(DEFAULT_PORTS[form.type], 10)
  return {
    id,
    name: form.name.trim(),
    type: form.type,
    host: form.type === "sqlite" ? "" : form.host.trim(),
    port,
    database: form.database.trim(),
    user: form.type === "sqlite" ? "" : form.user.trim(),
    password: form.type === "sqlite" ? "" : form.password,
    sslMode: form.type === "postgres" ? form.sslMode : "",
    ssh: buildSSHConfig(form),
  }
}

function formToConfig(form: FormState) {
  return {
    type: form.type,
    host: form.type === "sqlite" ? "" : form.host.trim(),
    port: form.type === "sqlite" ? 0 : parseInt(form.port, 10) || parseInt(DEFAULT_PORTS[form.type], 10),
    database: form.database.trim(),
    user: form.type === "sqlite" ? "" : form.user.trim(),
    password: form.type === "sqlite" ? "" : form.password,
    sslMode: form.type === "postgres" ? form.sslMode : "disable",
    ssh: buildSSHConfig(form),
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CreateConnectionDialogProps {
  open: boolean
  onClose: () => void
  /** If provided, the dialog opens in edit mode pre-filled with the entry */
  editEntry?: ConnectionEntry
}

export default function CreateConnectionDialog({
  open,
  onClose,
  editEntry,
}: CreateConnectionDialogProps) {
  const addConnection = useSetAtom(addConnectionAtom)
  const connect = useSetAtom(connectAtom)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAndConnecting, setSavingAndConnecting] = useState(false)

  // Sync form with editEntry every time the dialog opens
  useEffect(() => {
    if (open) {
      setForm(editEntry ? entryToForm(editEntry) : EMPTY_FORM)
      setErrors({})
    }
  }, [open, editEntry])


  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open) {
      onClose()
    }
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function setType(type: DBType) {
    setForm((prev) => {
      const next = { ...prev, type }
      if (type !== "sqlite" && (prev.port === "" || prev.port === DEFAULT_PORTS.postgres || prev.port === DEFAULT_PORTS.mysql)) {
        next.port = DEFAULT_PORTS[type]
      }
      if (type === "sqlite") {
        next.sshEnabled = false
      }
      return next
    })
    setErrors((prev) => ({ ...prev, host: undefined, port: undefined, database: undefined, user: undefined }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.database.trim()) errs.database = form.type === "sqlite" ? "File path is required" : "Database is required"

    if (form.type !== "sqlite") {
      if (!form.host.trim()) errs.host = "Host is required"
      const portNum = parseInt(form.port, 10)
      if (!form.port || isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errs.port = "Port must be 1-65535"
      }
      if (!form.user.trim()) errs.user = "User is required"
    }

    // SSH validation
    if (form.sshEnabled && form.type !== "sqlite") {
      if (!form.sshHost.trim()) errs.sshHost = "SSH host is required"
      if (!form.sshUser.trim()) errs.sshUser = "SSH user is required"
      if (form.sshAuthMethod === SSHAuthMethod.SSHAuthKey && !form.sshPrivateKey.trim()) {
        errs.sshPrivateKey = "Private key path is required"
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleTest() {
    if (!validate()) return
    setTesting(true)
    try {
      await ConnectionService.TestConnection(formToConfig(form))
      toaster.create({
        type: "success",
        title: "Connection successful",
        description:
          form.type === "sqlite"
            ? `Connected to ${form.database}`
            : `Connected to ${form.host}:${form.port}/${form.database}`,
      })
    } catch (err) {
      toaster.create({
        type: "error",
        title: "Connection failed",
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      await addConnection(formToEntry(form, editEntry?.id))
      toaster.create({
        type: "success",
        title: "Connection saved",
      })
      onClose()
    } catch (err) {
      toaster.create({
        type: "error",
        title: "Failed to save",
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndConnect() {
    if (!validate()) return
    setSavingAndConnecting(true)
    try {
      const id = await addConnection(formToEntry(form, editEntry?.id))
      const entry = formToEntry(form, id)
      await connect(entry)
      onClose()
    } catch (err) {
      toaster.create({
        type: "error",
        title: "Connection failed",
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSavingAndConnecting(false)
    }
  }

  const isLoading = testing || saving || savingAndConnecting
  const isSQLite = form.type === "sqlite"

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
      size="md"
      motionPreset="slide-in-bottom"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {editEntry ? "Edit Connection" : "New Connection"}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Close">
                <LuX />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body>
            <Stack gap={4}>
              {/* Database type */}
              <Field.Root>
                <Field.Label>Database type</Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Field
                    value={form.type}
                    onChange={(e) => setType(e.target.value as DBType)}
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              {/* Name */}
              <Field.Root invalid={!!errors.name}>
                <Field.Label>Name</Field.Label>
                <Input
                  placeholder={isSQLite ? "My SQLite DB" : `My ${form.type === "mysql" ? "MySQL" : "PostgreSQL"} DB`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={isLoading}
                />
                {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
              </Field.Root>

              {!isSQLite && (
                <>
                  {/* Host + Port */}
                  <Grid templateColumns="1fr auto" gap={3} alignItems="start">
                    <Field.Root invalid={!!errors.host}>
                      <Field.Label>Host</Field.Label>
                      <Input
                        placeholder="localhost"
                        value={form.host}
                        onChange={(e) => set("host", e.target.value)}
                        disabled={isLoading}
                      />
                      {errors.host && <Field.ErrorText>{errors.host}</Field.ErrorText>}
                    </Field.Root>
                    <Field.Root invalid={!!errors.port} width="90px">
                      <Field.Label>Port</Field.Label>
                      <Input
                        placeholder={DEFAULT_PORTS[form.type]}
                        value={form.port}
                        onChange={(e) => set("port", e.target.value)}
                        disabled={isLoading}
                      />
                      {errors.port && <Field.ErrorText>{errors.port}</Field.ErrorText>}
                    </Field.Root>
                  </Grid>

                  {/* Database */}
                  <Field.Root invalid={!!errors.database}>
                    <Field.Label>Database</Field.Label>
                    <Input
                      placeholder={form.type === "mysql" ? "mydb" : "postgres"}
                      value={form.database}
                      onChange={(e) => set("database", e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.database && <Field.ErrorText>{errors.database}</Field.ErrorText>}
                  </Field.Root>

                  {/* User */}
                  <Field.Root invalid={!!errors.user}>
                    <Field.Label>User</Field.Label>
                    <Input
                      placeholder={form.type === "mysql" ? "root" : "postgres"}
                      value={form.user}
                      onChange={(e) => set("user", e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.user && <Field.ErrorText>{errors.user}</Field.ErrorText>}
                  </Field.Root>

                  {/* Password */}
                  <Field.Root>
                    <Field.Label>Password</Field.Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      disabled={isLoading}
                    />
                  </Field.Root>

                  {/* SSL Mode (PostgreSQL only) */}
                  {form.type === "postgres" && (
                    <Field.Root>
                      <Field.Label>SSL Mode</Field.Label>
                      <NativeSelect.Root disabled={isLoading}>
                        <NativeSelect.Field
                          value={form.sslMode}
                          onChange={(e) => set("sslMode", e.target.value)}
                        >
                          <option value="disable">disable</option>
                          <option value="require">require</option>
                          <option value="verify-ca">verify-ca</option>
                          <option value="verify-full">verify-full</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  )}

                  {/* ─── SSH Tunnel Section ─────────────────────────────── */}
                  <Checkbox.Root
                    checked={form.sshEnabled}
                    onCheckedChange={(details) =>
                      setForm((prev) => ({ ...prev, sshEnabled: !!details.checked }))
                    }
                    disabled={isLoading}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Connect via SSH tunnel</Checkbox.Label>
                  </Checkbox.Root>

                  {form.sshEnabled && (
                    <Stack gap={3} pl={2} borderLeftWidth="2px" borderColor="border.muted">
                      {/* SSH Host + Port */}
                      <Grid templateColumns="1fr auto" gap={3} alignItems="start">
                        <Field.Root invalid={!!errors.sshHost}>
                          <Field.Label>SSH Host</Field.Label>
                          <Input
                            placeholder="bastion.example.com"
                            value={form.sshHost}
                            onChange={(e) => set("sshHost", e.target.value)}
                            disabled={isLoading}
                          />
                          {errors.sshHost && <Field.ErrorText>{errors.sshHost}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root width="90px">
                          <Field.Label>Port</Field.Label>
                          <Input
                            placeholder="22"
                            value={form.sshPort}
                            onChange={(e) => set("sshPort", e.target.value)}
                            disabled={isLoading}
                          />
                        </Field.Root>
                      </Grid>

                      {/* SSH User */}
                      <Field.Root invalid={!!errors.sshUser}>
                        <Field.Label>SSH User</Field.Label>
                        <Input
                          placeholder="ubuntu"
                          value={form.sshUser}
                          onChange={(e) => set("sshUser", e.target.value)}
                          disabled={isLoading}
                        />
                        {errors.sshUser && <Field.ErrorText>{errors.sshUser}</Field.ErrorText>}
                      </Field.Root>

                      {/* Auth Method */}
                      <Field.Root>
                        <Field.Label>Auth Method</Field.Label>
                        <NativeSelect.Root disabled={isLoading}>
                          <NativeSelect.Field
                            value={form.sshAuthMethod}
                            onChange={(e) => set("sshAuthMethod", e.target.value)}
                          >
                            <option value={SSHAuthMethod.SSHAuthKey}>Private Key</option>
                            <option value={SSHAuthMethod.SSHAuthPassword}>Password</option>
                            <option value={SSHAuthMethod.SSHAuthAgent}>SSH Agent</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>

                      {/* Auth-method-specific fields */}
                      {form.sshAuthMethod === SSHAuthMethod.SSHAuthKey && (
                        <>
                          <Field.Root invalid={!!errors.sshPrivateKey}>
                            <Field.Label>Private Key</Field.Label>
                            <Input
                              placeholder="~/.ssh/id_ed25519"
                              value={form.sshPrivateKey}
                              onChange={(e) => set("sshPrivateKey", e.target.value)}
                              disabled={isLoading}
                            />
                            {errors.sshPrivateKey && <Field.ErrorText>{errors.sshPrivateKey}</Field.ErrorText>}
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Passphrase (optional)</Field.Label>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={form.sshPassphrase}
                              onChange={(e) => set("sshPassphrase", e.target.value)}
                              disabled={isLoading}
                            />
                          </Field.Root>
                        </>
                      )}

                      {form.sshAuthMethod === SSHAuthMethod.SSHAuthPassword && (
                        <Field.Root>
                          <Field.Label>SSH Password</Field.Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={form.sshPassword}
                            onChange={(e) => set("sshPassword", e.target.value)}
                            disabled={isLoading}
                          />
                        </Field.Root>
                      )}

                      {form.sshAuthMethod === SSHAuthMethod.SSHAuthAgent && (
                        <Text fontSize="sm" color="fg.muted">
                          Using SSH agent (SSH_AUTH_SOCK)
                        </Text>
                      )}

                      {/* Remote Host + Port */}
                      <Grid templateColumns="1fr auto" gap={3} alignItems="start">
                        <Field.Root>
                          <Field.Label>Remote Host (optional)</Field.Label>
                          <Input
                            placeholder={form.host || "database host"}
                            value={form.sshRemoteHost}
                            onChange={(e) => set("sshRemoteHost", e.target.value)}
                            disabled={isLoading}
                          />
                          <Field.HelperText>Defaults to database host</Field.HelperText>
                        </Field.Root>
                        <Field.Root width="90px">
                          <Field.Label>Port</Field.Label>
                          <Input
                            placeholder={form.port || DEFAULT_PORTS[form.type]}
                            value={form.sshRemotePort}
                            onChange={(e) => set("sshRemotePort", e.target.value)}
                            disabled={isLoading}
                          />
                        </Field.Root>
                      </Grid>
                    </Stack>
                  )}
                </>
              )}

              {isSQLite && (
                <Field.Root invalid={!!errors.database}>
                  <Field.Label>Database file path</Field.Label>
                  <Input
                    placeholder="/path/to/database.db or :memory:"
                    value={form.database}
                    onChange={(e) => set("database", e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.database && <Field.ErrorText>{errors.database}</Field.ErrorText>}
                </Field.Root>
              )}
            </Stack>
          </Dialog.Body>

          <Dialog.Footer>
            <Flex justify="space-between" width="100%" gap={2}>
              <Box>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  loading={testing}
                  disabled={saving || savingAndConnecting}
                >
                  Test
                </Button>
              </Box>
              <Flex gap={2}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  disabled={testing || savingAndConnecting}
                >
                  Save
                </Button>
                <Button
                  variant="solid"
                  colorPalette="blue"
                  size="sm"
                  onClick={handleSaveAndConnect}
                  loading={savingAndConnecting}
                  disabled={testing || saving}
                >
                  Save &amp; Connect
                </Button>
              </Flex>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
