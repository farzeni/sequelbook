import { Button } from "@components/ui/button"


const QuickAdd = () => {
  return (
    <div className="relative py-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="w-full border " />
      <div className="absolute left-0 right-0 top-[-13px] z-50 flex justify-center items-center gap-4 ">
        <Button variant="outline">
          Add Code
        </Button>
        <Button variant="outline">
          Add Text
        </Button>
      </div>
    </div>
  )
}

export default QuickAdd