import { Route, Routes } from "react-router-dom";
import IndexScreen from "./screen";
import BookScreen from "./screen/book";
import ConnectionScreen from "./screen/connections";
import CreateConnectionScreen from "./screen/connections/CreateConnection";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexScreen />} />
      <Route path="/connections" element={<ConnectionScreen />} />
      <Route path="/connections/new" element={<CreateConnectionScreen />} />
      <Route path="/book/:bookId" element={<BookScreen />} />
    </Routes>
  )
}

export default Router;