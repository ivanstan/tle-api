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
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const NavButton = styled(Button)`
  && {
    color: rgba(255, 255, 255, 0.7);
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    text-transform: none;
    transition: all 0.2s ease;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
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

const MenuButton = styled(IconButton)`
  && {
    color: rgba(255, 255, 255, 0.8);
    margin-right: 8px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
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
            className={'d-block d-md-none'}
          >
            <MenuIcon />
          </MenuButton>

          <LogoButton href={'#/'}>
            <LogoText variant="h6">
              <span>TLE</span> API
            </LogoText>
          </LogoButton>

          <div className={'d-none d-md-block'}>{menu}</div>

          <Spacer />

          <DonateButton />
        </Toolbar>

        <Drawer variant="persistent" anchor="top" open={open}>
          <Menu onClick={toggleMenu}>{menu}</Menu>
        </Drawer>
      </StyledAppBar>
    </HideOnScroll>
  )
}

export default Navigation
