import Home  from './Pages/Home';
import Navbar from './Components/Navbar';
import "./App.css"
import About from './Pages/About';
import Skills from './Pages/Skills';
import Experience from './Pages/Experience';
import Projects from './Pages/Projects';
import Footer from './Pages/Contacts';


function App() {
  return (
    <div className='app'>
      <Navbar />
      <Home />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Footer />
    </div>
  );
}

export default App;
