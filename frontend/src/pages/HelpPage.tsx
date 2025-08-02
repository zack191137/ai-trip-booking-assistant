import React, { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material'
import {
  Help,
  ExpandMore,
  Search,
  Chat,
  Email,
  Phone,
} from '@mui/icons-material'

const FAQ_DATA = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I plan my first trip?',
        answer: 'Start by clicking "Plan New Trip" or navigating to the Chat page. Our AI assistant will guide you through the process by asking about your destination, dates, budget, and preferences.',
      },
      {
        question: 'Is my personal information secure?',
        answer: 'Yes, we take your privacy seriously. All your data is encrypted and stored securely. We never share your personal information with third parties without your consent.',
      },
      {
        question: 'Can I use the app offline?',
        answer: 'Some features work offline, like viewing your saved trips and itineraries. However, you need an internet connection for booking, real-time chat, and generating new trip plans.',
      },
    ],
  },
  {
    category: 'Trip Planning',
    questions: [
      {
        question: 'How does the AI trip planner work?',
        answer: 'Our AI analyzes your preferences, budget, and travel dates to create personalized itineraries. It considers factors like weather, local events, and your interests to suggest the best activities and accommodations.',
      },
      {
        question: 'Can I modify the suggested itinerary?',
        answer: 'Absolutely! You can edit any part of your itinerary, add or remove activities, change hotels, and adjust your schedule. The AI can also help you find alternatives based on your changes.',
      },
      {
        question: 'How accurate are the price estimates?',
        answer: 'Price estimates are based on current market data and historical trends. Actual prices may vary depending on availability, seasonal changes, and booking timing. We recommend booking early for better rates.',
      },
    ],
  },
  {
    category: 'Bookings',
    questions: [
      {
        question: 'Can I book flights and hotels directly through the app?',
        answer: 'Yes, you can book flights, hotels, and activities directly through our platform. We partner with trusted providers to ensure secure transactions and competitive prices.',
      },
      {
        question: 'What if I need to cancel or modify my booking?',
        answer: 'Cancellation and modification policies depend on the specific booking. You can view the terms for each booking in your trip details. Many bookings offer free cancellation within a certain timeframe.',
      },
      {
        question: 'Do you charge booking fees?',
        answer: 'We strive to offer transparent pricing. Any additional fees will be clearly displayed before you complete your booking. Most of our revenue comes from partner commissions, not user fees.',
      },
    ],
  },
  {
    category: 'Account & Billing',
    questions: [
      {
        question: 'How do I update my payment information?',
        answer: 'Go to Settings > Account > Payment Methods to add, update, or remove payment information. All payment data is securely encrypted and processed through trusted payment providers.',
      },
      {
        question: 'Can I share my trips with others?',
        answer: 'Yes, you can share your trip itineraries with friends and family. Use the share button on any trip to generate a shareable link or export as PDF.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'If you wish to delete your account, please contact our support team. We will help you export your data if needed and permanently delete your account as requested.',
      },
    ],
  },
]

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false)

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false)
  }

  const filteredFAQ = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0)

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Help />
            Help & Support
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find answers to common questions or get in touch with our support team
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* FAQ Section */}
          <Grid item xs={12} md={8}>
            {/* Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>

            {/* FAQ Accordion */}
            <Typography variant="h5" gutterBottom>
              Frequently Asked Questions
            </Typography>

            {filteredFAQ.map((category, categoryIndex) => (
              <Box key={category.category} sx={{ mb: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {category.category}
                </Typography>
                
                {category.questions.map((faq, questionIndex) => (
                  <Accordion
                    key={`${category.category}-${questionIndex}`}
                    expanded={expandedPanel === `panel-${categoryIndex}-${questionIndex}`}
                    onChange={handlePanelChange(`panel-${categoryIndex}-${questionIndex}`)}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ))}

            {filteredFAQ.length === 0 && searchQuery && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No results found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different keywords or contact our support team for help
                </Typography>
              </Paper>
            )}
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" gutterBottom>
              Need More Help?
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chat color="primary" />
                  <Typography variant="h6">
                    Live Chat
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get instant help from our support team
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Available: 24/7
                </Typography>
                <Button variant="contained" fullWidth>
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Email color="primary" />
                  <Typography variant="h6">
                    Email Support
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Send us a detailed message about your issue
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Response time: 24 hours
                </Typography>
                <Button variant="outlined" fullWidth>
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Phone color="primary" />
                  <Typography variant="h6">
                    Phone Support
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Speak directly with our support team
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Available: Mon-Fri, 9 AM - 6 PM EST
                </Typography>
                <Typography variant="h6" color="primary">
                  1-800-TRIP-HELP
                </Typography>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Button fullWidth sx={{ justifyContent: 'flex-start', mb: 1 }}>
                  Getting Started Guide
                </Button>
                <Button fullWidth sx={{ justifyContent: 'flex-start', mb: 1 }}>
                  Video Tutorials
                </Button>
                <Button fullWidth sx={{ justifyContent: 'flex-start', mb: 1 }}>
                  Community Forum
                </Button>
                <Button fullWidth sx={{ justifyContent: 'flex-start' }}>
                  Feature Requests
                </Button>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}