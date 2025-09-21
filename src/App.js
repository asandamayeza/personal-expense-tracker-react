import './App.css';
import Welcome from './components/Welcome';
import Home from './components/Home';


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
          <Route path="/" element={<Welcome/>} /> 
          
          <Route path="/home" element={<Home/>} />
          
         
          
        </Routes>
    </Router>

    </div>
  );
}

export default App;
