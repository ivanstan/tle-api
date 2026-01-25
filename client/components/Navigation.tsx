import { useState } from 'react'
import { HideOnScroll } from './HideOnScroll'
import {
  AppBar,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import styled from 'styled-components'
import { DonateButton } from './DonateButton'

const Menu = styled.div`
  background: rgba(10, 14, 26, 0.98);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px;
  gap: 8px;
  min-width: 250px;
  width: 100vw;
  box-sizing: border-box;
`

const NavButton = styled(Button)`
  && {
    color: rgba(255, 255, 255, 0.7);
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 12px 16px;
    border-radius: 8px;
    text-transform: none;
    transition: all 0.2s ease;
    justify-content: flex-start;
    width: 100%;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    @media (min-width: 768px) {
      width: auto;
    }
  }
`

const LogoButton = styled(Button)`
  && {
    padding: 4px 12px;
    border-radius: 8px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`

const LogoText = styled(Typography)`
  && {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: -0.02em;
    
    span {
      color: #4aa564;
    }
  }
`

const StyledAppBar = styled(AppBar)`
  && {
    background: rgba(10, 14, 26, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }
`

const Spacer = styled.div`
  flex-grow: 1;
`

const DesktopMenu = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
`

const MenuButton = styled(IconButton)`
  && {
    color: rgba(255, 255, 255, 0.8);
    margin-right: 8px;
    display: block;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    @media (min-width: 768px) {
      display: none;
    }
  }
`

const Navigation = () => {
  const [open, setOpen] = useState(false)

  const toggleMenu = () => {
    setOpen(!open)
  }

  const menu = (
    <>
      <NavButton href={'#/'}>
        Index
      </NavButton>
      <NavButton href={'#/browse'}>
        Browse
      </NavButton>
      <NavButton href={'#docs'}>
        Documentation
      </NavButton>
      <NavButton href={'#health'}>
        Health
      </NavButton>
    </>
  )

  return (
    <HideOnScroll>
      <StyledAppBar position="static" elevation={0}>
        <Toolbar>
          <MenuButton
            edge="start"
            aria-label="open drawer"
            onClick={toggleMenu}
          >
            <MenuIcon />
          </MenuButton>

          <LogoButton href={'#/'}>
            <LogoText variant="h6">
              <span>TLE</span> API
            </LogoText>
          </LogoButton>

          <DesktopMenu>{menu}</DesktopMenu>

          <Spacer />

          <DonateButton />
        </Toolbar>

        <Drawer 
          variant="temporary" 
          anchor="top" 
          open={open}
          onClose={toggleMenu}
          sx={{
            '& .MuiDrawer-paper': {
              marginTop: '64px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <Menu onClick={toggleMenu}>{menu}</Menu>
        </Drawer>
      </StyledAppBar>
    </HideOnScroll>
  )
}

export default Navigation
