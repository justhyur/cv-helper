import { ContextProvider } from '/lib/Context';
import '../styles/globals.scss';

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
