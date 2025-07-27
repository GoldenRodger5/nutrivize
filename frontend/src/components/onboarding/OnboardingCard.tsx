import React from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue
} from '@chakra-ui/react'

interface OnboardingCardProps {
  title: string
  children: React.ReactNode
  icon?: string
  maxWidth?: string
}

export default function OnboardingCard({ 
  title, 
  children, 
  icon, 
  maxWidth = "600px" 
}: OnboardingCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  return (
    <Card
      maxW={maxWidth}
      w="full"
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      shadow="lg"
      mx="auto"
    >
      <CardHeader pb={2}>
        <Heading size="lg" textAlign="center" color="green.500">
          {icon && <Box as="span" mr={3}>{icon}</Box>}
          {title}
        </Heading>
      </CardHeader>
      <CardBody pt={2}>
        {children}
      </CardBody>
    </Card>
  )
}
