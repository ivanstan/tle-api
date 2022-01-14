import React from 'react'
import { Slide, useScrollTrigger } from "@material-ui/core"
import { ReactElementLike } from "prop-types"

interface HideOnScrollPropsInterface {
  children: ReactElementLike,
  window?: Function,
}

export function HideOnScroll(props: HideOnScrollPropsInterface) {
  const { children, window } = props
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({ target: window ? window() : undefined })

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  )
}
