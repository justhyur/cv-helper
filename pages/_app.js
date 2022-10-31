import { ContextProvider } from '/lib/Context';
import { ToastContainer } from 'react-toastify';
import '../styles/globals.scss';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }) {

  

  return(<>
      <ContextProvider>
        {/* <Navbar /> */}
        <Component {...pageProps} />
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ContextProvider>
    </>
  ) 
}

export default MyApp
