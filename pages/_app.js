import { ContextProvider } from '/lib/Context';
import '../styles/globals.scss';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }) {

  

  return(<>
      <ContextProvider>
        {/* <Navbar /> */}
        <Component {...pageProps} />
      </ContextProvider>
    </>
  ) 
}

export default MyApp
