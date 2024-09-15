import { FC } from "react"
import { Box } from "theme-ui"

interface ScreenContainerProps {
  children: React.ReactNode | React.ReactNode[]
}


const ScreenContainer: FC<ScreenContainerProps> = ({ children }) => {
  return (
    <Box>
      {children}
    </Box>
  )
}

export default ScreenContainer
