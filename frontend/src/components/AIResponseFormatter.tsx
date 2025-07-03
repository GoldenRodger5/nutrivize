import React from 'react'
import { Box, Text, Code } from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'

interface AIResponseFormatterProps {
  content: string
  isMobile?: boolean
  fontSize?: string
}

// Helper function to format AI responses properly
const formatAIResponse = (content: string) => {
  // Handle different types of AI responses
  
  // 1. Clean up any backend operation markers that shouldn't be visible
  let cleanedContent = content
    .replace(/AI_SEARCH_FOODS:\s*[^\n]*/gi, '')
    .replace(/AI_LOG_FOOD:\s*[^\n]*/gi, '')
    .replace(/AI_CREATE_MEAL_PLAN:\s*[^\n]*/gi, '')
    .replace(/AI_INDEX_FOOD:\s*[^\n]*/gi, '')
    .replace(/AI_SAVE_PREFERENCES:\s*[^\n]*/gi, '')
    .replace(/AI_UPDATE_GOAL:\s*[^\n]*/gi, '')
    .replace(/AI_SEARCH_USER_LOGS:\s*[^\n]*/gi, '')
  
  // 2. Handle error messages and make them user-friendly
  cleanedContent = cleanedContent
    .replace(/❌ Couldn't search foods:[^\n]*/gi, '🔍 Searching your food database...')
    .replace(/Expecting property name enclosed in double quotes[^\n]*/gi, '')
    .replace(/line \d+ column \d+ \(char \d+\)/gi, '')
  
  // 3. Format common response patterns better
  
  // Food index responses
  if (content.toLowerCase().includes('food index') || content.toLowerCase().includes('indexed foods')) {
    // Format responses about food index search
    cleanedContent = cleanedContent
      .replace(/Let me search your food index\.?\s*/gi, '🍎 **Your Food Index:**\n\n')
      .replace(/Based on the context provided,?\s*/gi, '')
      .replace(/I can see that your food index is currently empty or not available/gi, 'Your food index appears to be empty. You can add foods by logging meals or manually adding them.')
      .replace(/Let me search your personal food index\./gi, '🔍 **Searching Food Index:**\n\n')
      
    // Handle responses about not finding food index or not having access
    if (cleanedContent.toLowerCase().includes('don\'t have direct access')) {
      cleanedContent = '🔍 **Food Index Search:**\n\n' + cleanedContent
        .replace(/Note: I notice/gi, '')
        .replace(/Would you like me to:/gi, '**I can help you with:**')
    }
    
    // Handle "I see you're asking about your food index" pattern
    if (cleanedContent.toLowerCase().includes('i see you\'re asking about your food index')) {
      cleanedContent = cleanedContent
        .replace(/I see you're asking about your food index/gi, '🔍 **Food Index Query:**\n\n')
        .replace(/indexed foods in your records/gi, '**indexed foods** in your records')
    }
    
    // Convert the numbered list format in food index responses
    cleanedContent = cleanedContent.replace(/(\d+)\.\s+([^\n]+)/g, '* **$2**')
  }
  
  // Calorie questions
  if (content.toLowerCase().includes('calorie') && content.toLowerCase().includes('should')) {
    cleanedContent = cleanedContent
      .replace(/Based on your profile/gi, '📊 **Calorie Recommendation:**\n\nBased on your profile')
  }
  
  // Meal planning responses
  if (content.toLowerCase().includes('meal plan') || content.toLowerCase().includes('meal suggestion')) {
    cleanedContent = cleanedContent
      .replace(/I'd love to help you/gi, "🍽️ **Meal Planning:**\n\nI'd love to help you")
  }
  
  // Restaurant/food analysis
  if (content.toLowerCase().includes('restaurant') || content.toLowerCase().includes('menu')) {
    cleanedContent = cleanedContent
      .replace(/Based on the image/gi, '🍴 **Restaurant Analysis:**\n\nBased on the image')
      .replace(/I can see/gi, '👀 I can see')
  }
  
  // Health insights
  if (content.toLowerCase().includes('health') && (content.toLowerCase().includes('insight') || content.toLowerCase().includes('progress'))) {
    cleanedContent = cleanedContent
      .replace(/Based on your recent/gi, '📈 **Health Insights:**\n\nBased on your recent')
  }
  
  // Goal monitoring
  if (content.toLowerCase().includes('goal') && (content.toLowerCase().includes('progress') || content.toLowerCase().includes('target'))) {
    cleanedContent = cleanedContent
      .replace(/Your current/gi, '🎯 **Goal Progress:**\n\nYour current')
  }
  
  // Nutrition analysis
  if (content.toLowerCase().includes('nutrition') && (content.toLowerCase().includes('analysis') || content.toLowerCase().includes('breakdown'))) {
    cleanedContent = cleanedContent
      .replace(/Here's your/gi, '📊 **Nutrition Analysis:**\n\nHere\'s your')
  }
  
  // 4. Clean up extra spacing and formatting
  cleanedContent = cleanedContent
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple line breaks
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\s+([.!?])/g, '$1') // Fix spacing before punctuation
  
  // 5. Handle lists and structured content
  if (cleanedContent.includes('•') || cleanedContent.includes('-') || /\d+\.\s/.test(cleanedContent)) {
    // Convert bullet points to proper markdown lists
    cleanedContent = cleanedContent
      // Convert numbered lists (1. Item) to proper markdown
      .replace(/(^|\n)(\d+)\.\s+/gm, '$1$2. ')
      // Convert bullet points to proper markdown lists
      .replace(/(^|\n)[•]\s*/gm, '$1* ')
      // Ensure proper dash list formatting
      .replace(/(^|\n)[-]\s*/gm, '$1- ')
  }
  
  // Convert "You're X" or "You X" patterns at the beginning of lines into bullet points
  cleanedContent = cleanedContent.replace(/(^|\n)You('re| are| have| prefer| avoid)/gm, '$1* You$2')
  
  // Make sure there's a blank line before lists to ensure proper markdown rendering
  cleanedContent = cleanedContent.replace(/([^\n])\n(\*|-|\d+\.)/g, '$1\n\n$2')
  
  // 6. Format common question-answer patterns
  if (cleanedContent.toLowerCase().includes('i see you\'re asking about') || 
      cleanedContent.toLowerCase().includes('i see that you\'re asking')) {
    cleanedContent = cleanedContent.replace(
      /I see (?:that )?you're asking about your food index/i, 
      '🔍 **Food Index Query:**\n\n'
    )
  }
  
  // 7. Add helpful emojis for context if none present
  if (!cleanedContent.match(/^[🔍🍎📊🍽️💡⚠️✅❌🍴👀📈🎯]/)) {
    if (content.toLowerCase().includes('nutrition') || content.toLowerCase().includes('health')) {
      cleanedContent = '💡 ' + cleanedContent
    } else if (content.toLowerCase().includes('error') || content.toLowerCase().includes('sorry')) {
      cleanedContent = '⚠️ ' + cleanedContent
    } else if (content.toLowerCase().includes('would you like')) {
      cleanedContent = '💬 ' + cleanedContent
    }
  }
  
  // Handle specific response patterns we see in the chat
  if (cleanedContent.includes('What would you prefer?')) {
    cleanedContent = cleanedContent.replace(/What would you prefer\?/g, '**What would you prefer?**')
  }
  
  // Specifically catch the "I'm not able to see" pattern
  if (cleanedContent.toLowerCase().includes('i\'m not able to see') || 
      cleanedContent.toLowerCase().includes('i see you\'re asking about')) {
    cleanedContent = '🔍 **Food Index Search:**\n\n' + cleanedContent
      .replace(/I see you're asking about your food index, but/gi, '')
      .replace(/I'm not able to see any specifically indexed foods/gi, "I'm not able to see any **specifically indexed foods**")
  }
  
  // Make vegetarian and preferences bold
  cleanedContent = cleanedContent
    .replace(/You're vegetarian/g, "* You're **vegetarian**")
    .replace(/You avoid nuts/g, "* You **avoid nuts**")
    .replace(/You prefer Mediterranean/g, "* You **prefer Mediterranean**")
    .replace(/What I do know about you is:/g, "**What I know about you:**")
  
  return cleanedContent
}

export const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({
  content,
  isMobile = false,
  fontSize = 'md'
}) => {
  const formattedContent = formatAIResponse(content)
  
  return (
    <Box>
      <ReactMarkdown
        components={{
          // Custom components for better formatting
          h1: ({ children }) => <Text fontSize="lg" fontWeight="bold" mb={2}>{children}</Text>,
          h2: ({ children }) => <Text fontSize="md" fontWeight="bold" mb={2}>{children}</Text>,
          h3: ({ children }) => <Text fontSize="sm" fontWeight="bold" mb={1}>{children}</Text>,
          p: ({ children }) => <Text fontSize={isMobile ? "sm" : fontSize} lineHeight="1.6" mb={2}>{children}</Text>,
          strong: ({ children }) => <Text as="span" fontWeight="bold">{children}</Text>,
          em: ({ children }) => <Text as="span" fontStyle="italic">{children}</Text>,
          ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
          ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
          li: ({ children }) => <Text as="li" fontSize={isMobile ? "sm" : fontSize} mb={1}>{children}</Text>,
          code: ({ children }) => <Code fontSize="xs" px={1}>{children}</Code>,
          blockquote: ({ children }) => (
            <Box borderLeft="3px solid" borderColor="gray.300" pl={3} ml={2} mb={2}>
              {children}
            </Box>
          )
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </Box>
  )
}

export default AIResponseFormatter
