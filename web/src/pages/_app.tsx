import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/red-hat-display/500.css";
import React from "react";
import { GeneralContainer } from "../components/GeneralContainer";
import theme from "../theme";
import { withApollo } from "../utils/withApollo";

function MyApp({ Component, pageProps }: any) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <GeneralContainer>
        <Component {...pageProps} />
      </GeneralContainer>
    </ChakraProvider>
  );
}

export default withApollo({})(MyApp);
