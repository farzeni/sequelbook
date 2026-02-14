import { FC } from "react";

interface PageTitleProps {
  title: string;
  children?: React.ReactNode;
}

const PageTitle: FC<PageTitleProps> = ({ title, children }) => {
  return (
    <div className="mb-2 mt-2 items-center justify-center">
      <span className="text-lg font-bold">
        {title}
      </span>

      <div>
        {children}
      </div>
    </div>
  )
}

export default PageTitle