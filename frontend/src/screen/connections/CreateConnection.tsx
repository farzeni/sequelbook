import { Button } from "@/src/components/ui/button"
import { Container } from "@/src/components/ui/container"
import PageTitle from "@/src/components/ui/page-title"
import { CreateConnection } from "@/src/lib/wailsjs/go/connections/ConnectionStore"
import { connections } from "@/src/lib/wailsjs/go/models"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"


const CreateConnectionScreen = () => {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<connections.ConnectionData>()

  const onSubmit = async (data: connections.ConnectionData) => {
    console.log(data)

    data.port = parseInt(data.port.toString())
    const connection = await CreateConnection(data)

    alert("Connection created " + connection.name)

    navigate("/connections")
  }

  return (
    <div>
      <div className="flex h-[50px] border-b-1 p-4 items-center justify-between">
        <a onClick={() => history.back()}>back</a>
      </div>
      <Container>

        <PageTitle title="New Connection" />

        <div>
          <input {...register("name", { required: true })} placeholder="Name" />
          {errors.name && <span>This field is required</span>}

          <input {...register("host", { required: true })} placeholder="Host" />
          {errors.host && <span>This field is required</span>}

          <input {...register("port", { required: true })} placeholder="Port" />
          {errors.port && <span>This field is required</span>}

          <input {...register("user", { required: true })} placeholder="Username" />
          {errors.user && <span>This field is required</span>}

          <input {...register("pass", { required: true })} placeholder="Password" />
          {errors.pass && <span>This field is required</span>}

          <input {...register("db", { required: true })} placeholder="Database" />
          {errors.db && <span>This field is required</span>}

          <Button onClick={handleSubmit(onSubmit)}>Create</Button>
        </div>
      </Container>
    </div>

  )
}

export default CreateConnectionScreen