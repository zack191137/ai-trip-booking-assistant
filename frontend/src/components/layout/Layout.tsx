import React, { useState, useEffect } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar, DRAWER_WIDTH } from './Sidebar'

export function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDrawerClose = () => {
    setMobileOpen(false)
  }

  // Close mobile drawer when screen size changes to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={handleDrawerToggle} isMobile={isMobile} />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          open={true}
          onClose={handleDrawerClose}
          variant="permanent"
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerClose}
          variant="temporary"
        />
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          backgroundColor: 'background.default',
        }}
      >
        {/* Toolbar spacer */}
        <Box sx={{ height: 64 }} />
        
        {/* Page Content */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}