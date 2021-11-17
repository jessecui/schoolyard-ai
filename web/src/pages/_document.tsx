import { ColorModeScript } from '@chakra-ui/color-mode'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import theme from '../theme'

export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head />
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <body>          
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
