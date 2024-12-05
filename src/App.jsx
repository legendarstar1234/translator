import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  
import Client from './components/Pages/Client';
import Customer from './components/Pages/Customer';

function App() {  
  return (  
    <Router>  
      <Routes>  
        <Route path="/" element={<Client />} />  
        <Route path="/customer" element={<Customer />} />   
      </Routes>  
    </Router>  
  );  
}  

export default App;