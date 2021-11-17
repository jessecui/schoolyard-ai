import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config : ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
}

const fonts = {
  heading: "Red Hat Display",
  body: "Nunito Sans",
}

const styles = {
  global: {
    'html, body': {
      background: '#F4F4F4',
    },
  },
}

const colors = {
  grayMain: "#707F95",
  grayLight: "#E8E8E8",
  iris: "#5565F6",
  irisDark: "#2A327B",
  mint: "#3AD69E",
  blueSky: "#1B91FF"
}

const theme = extendTheme({config, fonts, styles, colors});

export default theme;
