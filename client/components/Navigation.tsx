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
  background: #0b3d91;
  display: flex;
  flex-direction: column;
  align-items: baseline;
  padding: 15px;
`

const Navigation = () => {
  const [open, setOpen] = useState(false)

  const toggleMenu = () => {
    setOpen(!open)
  }

  const menu = (
    <>
      <Button href={'#/'} sx={{ color: '#f1f1f1' }}>
        Index
      </Button>
      <Button href={'#/browse'} sx={{ color: '#f1f1f1' }}>
        Browse
      </Button>
      <Button href={'#docs'} sx={{ color: '#f1f1f1' }}>
        Documentation
      </Button>
      <Button href={'#health'} sx={{ color: '#f1f1f1' }}>
        Health
      </Button>
    </>
  )

  return (
    <HideOnScroll>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleMenu}
            className={'d-block d-md-none'}
          >
            <MenuIcon />
          </IconButton>

          <Button href={'#/'}>
            <Typography variant="h6" sx={{ color: '#f1f1f1' }}>
              TLE API
            </Typography>
          </Button>

          <div className={'d-none d-md-block'}>{menu}</div>

          <div style={{ flexGrow: 1 }}></div>

          <DonateButton />
        </Toolbar>

        <Drawer variant="persistent" anchor="top" open={open}>
          <Menu onClick={toggleMenu}>{menu}</Menu>
        </Drawer>
      </AppBar>
    </HideOnScroll>
  )
}

export default Navigation
