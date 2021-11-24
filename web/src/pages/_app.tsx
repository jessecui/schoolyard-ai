import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/red-hat-display/500.css";
import React from "react";
import { SiteLayout } from "../components/SiteLayout";
import theme from "../theme";
import { withApollo } from "../utils/withApollo";

function MyApp({ Component, pageProps }: any) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </ChakraProvider>
  );
}

export default withApollo({})(MyApp);
