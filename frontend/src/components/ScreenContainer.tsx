import { FC } from "react"

interface ScreenContainerProps {
  children: React.ReactNode | React.ReactNode[]
}


const ScreenContainer: FC<ScreenContainerProps> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  )
}

export default ScreenContainer
