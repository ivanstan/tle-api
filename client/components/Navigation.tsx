import React from 'react'
import { HideOnScroll } from './HideOnScroll'
import { AppBar, Button, Drawer, IconButton, Toolbar, Typography, withStyles } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu'
import styled from 'styled-components'
import { DonateButton } from "./DonateButton"

const Menu = styled.div`
  background: #0b3d91
  display: flex
  flex-direction: column
  align-items: baseline
  padding: 15px
`

const styles = (theme: any) => ({
  label: {
    color: '#f1f1f1',
  },
});

class Navigation extends React.Component<any, any> {

  public readonly state = {
    open: false,
  }

  toggleMenu = () => {
    this.setState({
      open: !this.state.open
    })
  }

  render() {
    const { classes } = this.props

    const menu = (
      <>
        <Button href={'#/'}>
          Index
        </Button>
        <Button href={'#/browse'}>
          Browse
        </Button>
        <Button href={'#docs'}>
          Documentation
        </Button>
        <Button href={'#health'}>
          Health
        </Button>
      </>
    )

    return (
      <HideOnScroll {...this.props}>

        <AppBar position='static' elevation={0}>

          <Toolbar>
            <IconButton
              edge='start'
              color='inherit'
              aria-label='open drawer'
              onClick={this.toggleMenu}
              className={'d-block d-md-none'}
            >
              <MenuIcon />
            </IconButton>

            <Button href={'#/'}>
              <Typography variant='h6'>
                TLE API
              </Typography>
            </Button>

            <div className={'d-none d-md-block'}>
              {menu}
            </div>

            <div style={{flexGrow: 1}}>

            </div>

            <DonateButton/>

          </Toolbar>

          <Drawer
            variant='persistent'
            anchor='top'
            open={this.state.open}
          >
            <Menu onClick={this.toggleMenu}>
              {menu}
            </Menu>
          </Drawer>

        </AppBar>

      </HideOnScroll>
    )
  }
}

export default withStyles(styles)(Navigation)
