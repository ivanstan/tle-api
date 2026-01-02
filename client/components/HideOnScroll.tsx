import { ReactElement } from 'react'
import { Slide, useScrollTrigger } from '@mui/material'

interface HideOnScrollPropsInterface {
  children: ReactElement
  window?: () => Window
}

export function HideOnScroll(props: HideOnScrollPropsInterface) {
  const { children, window } = props
  const trigger = useScrollTrigger({ target: window ? window() : undefined })

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  )
}
