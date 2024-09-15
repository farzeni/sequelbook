import { Route, Routes } from "react-router-dom";
import IndexScreen from "./screens";
import BookScreen from "./screens/book";
import ChapterScreen from "./screens/book/chapter";
import ConnectionScreen from "./screens/connections";
import CreateConnectionScreen from "./screens/connections/CreateConnection";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexScreen />} />
      <Route path="/connections" element={<ConnectionScreen />} />
      <Route path="/connections/new" element={<CreateConnectionScreen />} />
      <Route path="/book/:bookId" element={<BookScreen />} >
        <Route path=":chapterId" element={<ChapterScreen />} />
      </Route>
    </Routes>
  )
}

export default Router;