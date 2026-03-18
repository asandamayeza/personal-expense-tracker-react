import './App.css';
import Welcome from './components/Welcome';
import Home from './components/Home';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Profile from './components/Profile';



import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

function App() {


  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />

          <Route path="/home" element={<Home />} />

          <Route path="/transactions" element={<Transactions />} />

          <Route path="/analytics" element={<Analytics />} />


          <Route path="/profile" element={<Profile />} />

          




        </Routes>
      </Router>

    </div>
  );
}

export default App;
