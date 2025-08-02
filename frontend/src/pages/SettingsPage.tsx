import React from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
} from '@mui/material'
import {
  Settings,
  Notifications,
  Language,
  Security,
  Palette,
  Person,
  Help,
  Info,
} from '@mui/icons-material'

export function SettingsPage() {
  const [settings, setSettings] = React.useState({
    notifications: true,
    emailUpdates: false,
    darkMode: true,
    autoSave: true,
  })

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account preferences and application settings
          </Typography>
        </Box>

        {/* Notifications */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications />
              Notifications
            </Typography>
          </Box>
          <List>
            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive notifications about trip updates and bookings"
              />
              <Switch
                checked={settings.notifications}
                onChange={() => handleSettingChange('notifications')}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Email Updates"
                secondary="Get email notifications for important updates"
              />
              <Switch
                checked={settings.emailUpdates}
                onChange={() => handleSettingChange('emailUpdates')}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Appearance */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette />
              Appearance
            </Typography>
          </Box>
          <List>
            <ListItem>
              <ListItemText
                primary="Dark Mode"
                secondary="Use dark theme for better viewing in low light"
              />
              <Switch
                checked={settings.darkMode}
                onChange={() => handleSettingChange('darkMode')}
              />
            </ListItem>
          </List>
        </Paper>

        {/* General */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              General
            </Typography>
          </Box>
          <List>
            <ListItem>
              <ListItemText
                primary="Auto-save Conversations"
                secondary="Automatically save your chat conversations"
              />
              <Switch
                checked={settings.autoSave}
                onChange={() => handleSettingChange('autoSave')}
              />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText
                primary="Language"
                secondary="English (US)"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Account */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Account
            </Typography>
          </Box>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText
                primary="Profile Settings"
                secondary="Update your personal information"
              />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText
                primary="Security & Privacy"
                secondary="Manage your security settings"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Support */}
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Help />
              Support
            </Typography>
          </Box>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Help />
              </ListItemIcon>
              <ListItemText
                primary="Help Center"
                secondary="Get help and find answers to common questions"
              />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="About"
                secondary="App version and information"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Container>
  )
}