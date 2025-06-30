import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import DiffPage from './pages/DiffPage.js';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/diff" element={<DiffPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
