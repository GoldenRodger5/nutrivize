import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  HStack,
  Icon,
  useBreakpointValue
} from '@chakra-ui/react'
import { FiZap, FiCalendar, FiEdit3 } from 'react-icons/fi'
import MealSuggestions from './MealSuggestions'
import MealPlans from './MealPlans'
import ManualMealPlanner from './ManualMealPlanner'

export default function MealPlanningHub() {
  const [activeTab, setActiveTab] = useState(0)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  const tabs = [
    {
      label: 'AI Meal Ideas',
      icon: FiZap,
      component: <MealSuggestions />
    },
    {
      label: 'Meal Plans',
      icon: FiCalendar,
      component: <MealPlans />
    },
    {
      label: 'Manual Planning',
      icon: FiEdit3,
      component: <ManualMealPlanner />
    }
  ]

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)">
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="lg" color="green.600" mb={2}>
            Meal Planning Hub
          </Heading>
          <Box fontSize="md" color="gray.600">
            Plan your meals with AI suggestions, organized meal plans, or manual planning
          </Box>
        </Box>

        <Box bg={bg} borderRadius="xl" borderWidth={1} borderColor={borderColor} overflow="hidden">
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="enclosed"
            colorScheme="green"
          >
            <TabList bg={useColorModeValue('gray.50', 'gray.700')} borderBottom="none">
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  fontSize={isMobile ? "sm" : "md"}
                  fontWeight="medium"
                  _selected={{
                    bg: bg,
                    borderBottomColor: bg,
                    color: 'green.600'
                  }}
                >
                  <HStack spacing={2}>
                    <Icon as={tab.icon} />
                    <Box>{tab.label}</Box>
                  </HStack>
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {tabs.map((tab, index) => (
                <TabPanel key={index} p={0}>
                  {tab.component}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </Box>
  )
}
