import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Box, Button, Container, Input } from "@chakra-ui/react"
import { Add } from "../../../wailsjs/go/backend/ConnectionStore"
import { backend } from "../../../wailsjs/go/models"
import ScreenContainer from "../../components/ScreenContainer"
import PageTitle from "../../components/ui/PageTitle"


const CreateConnectionScreen = () => {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<backend.ConnectionCreateData>()

  const onSubmit = async (data: backend.ConnectionCreateData) => {
    console.log(data)

    data.port = parseInt(data.port.toString())
    const connection = await Add(data)

    alert("Connection created " + connection.name)

    navigate("/connections")
  }

  return (
    <ScreenContainer>
      <Box sx={{
        height: "50px",
        borderBottom: "1px solid #e0e0e0",
        padding: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <a onClick={() => history.back()}>back</a>
      </Box>
      <Container>

        <PageTitle title="New Connection" />

        <Box>
          <Input {...register("name", { required: true })} placeholder="Name" />
          {errors.name && <span>This field is required</span>}

          <Input {...register("host", { required: true })} placeholder="Host" />
          {errors.host && <span>This field is required</span>}

          <Input {...register("port", { required: true })} placeholder="Port" />
          {errors.port && <span>This field is required</span>}

          <Input {...register("user", { required: true })} placeholder="Username" />
          {errors.user && <span>This field is required</span>}

          <Input {...register("pass", { required: true })} placeholder="Password" />
          {errors.pass && <span>This field is required</span>}

          <Input {...register("db", { required: true })} placeholder="Database" />
          {errors.db && <span>This field is required</span>}

          <Button onClick={handleSubmit(onSubmit)}>Create</Button>
        </Box>
      </Container>
    </ScreenContainer>

  )
}

export default CreateConnectionScreen