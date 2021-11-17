import { Container } from "@chakra-ui/layout";
import { Box } from "@chakra-ui/react";
import React from "react";
import { Navbar } from "./Navbar";

interface GeneralContainerProps {}

export const GeneralContainer: React.FC<GeneralContainerProps> = ({
  children,
}) => {
  return (
    <>
      <Navbar />
      <Container mt={4} maxW="container.sm">{children}</Container>  
    </>
  );
};
