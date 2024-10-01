import { useTranslation } from "react-i18next";


const ContentsPanel = () => {
  const { t } = useTranslation();



  return (
    <div className="w-full">
      <div className="h-[40px] border-b flex w-full ">
        <div className="pl-2 flex justify-between items-center w-full">
          <h1 className="text-xs uppercase">{t("contents", "contents")}</h1>
        </div>
      </div>

    </div>
  )
}

export default ContentsPanel