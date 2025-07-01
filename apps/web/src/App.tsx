import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import DiffPage from './pages/DiffPage.js';

const App = () => (
  <div className="min-h-screen">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diff" element={<DiffPage />} />
      </Routes>
    </BrowserRouter>
  </div>
);

export default App;
