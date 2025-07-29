import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Link,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
  isVisible: boolean;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAccept,
  onDecline,
  isVisible,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!isVisible) return null;

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTopWidth={1}
      borderColor={borderColor}
      p={4}
      zIndex={1000}
      boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
    >
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle fontSize="md" mb={1}>
            Cookie Notice
          </AlertTitle>
          <AlertDescription fontSize="sm">
            We use cookies to improve your experience and analyze app usage. 
            Essential cookies are required for the app to function properly.{' '}
            <Link
              href="/privacy-policy"
              color="blue.500"
              textDecoration="underline"
              isExternal
            >
              Learn more about our privacy practices
              <ExternalLinkIcon mx="2px" />
            </Link>
          </AlertDescription>
          <VStack spacing={2} align="start" mt={3}>
            <Text fontSize="xs" color="gray.600">
              • Essential: Authentication, security, app functionality
            </Text>
            <Text fontSize="xs" color="gray.600">
              • Analytics: Usage patterns, performance monitoring (optional)
            </Text>
          </VStack>
          <Box mt={4}>
            <Button
              colorScheme="blue"
              size="sm"
              mr={3}
              onClick={onAccept}
            >
              Accept All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDecline}
            >
              Essential Only
            </Button>
          </Box>
        </Box>
      </Alert>
    </Box>
  );
};

export default CookieConsent;
