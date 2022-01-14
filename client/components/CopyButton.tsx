import React from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import { ClickAwayListener, IconButton, Tooltip } from "@material-ui/core"

export class CopyButton extends React.Component<any, any> {

  readonly state = {
    open: false
  }

  render() {
    const { open } = this.state
    const { value } = this.props

    return (
      <ClickAwayListener onClickAway={() => this.setState({ open: false })}>
          <Tooltip
            PopperProps={{
              disablePortal: true,
            }}
            onClose={() => this.setState({ open: false })}
            open={open}
            disableFocusListener
            disableHoverListener
            disableTouchListener
            title="Copied"
          >
            <CopyToClipboard text={value} onCopy={() => this.setState({ open: true })}>
              <IconButton>
                <i className="fas fa-paste"/>
              </IconButton>
            </CopyToClipboard>
          </Tooltip>
      </ClickAwayListener>
    )
  }
}
