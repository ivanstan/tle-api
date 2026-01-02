import { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material'

interface CopyButtonProps {
  value: string
}

export const CopyButton = ({ value }: CopyButtonProps) => {
  const [open, setOpen] = useState(false)

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip
        PopperProps={{
          disablePortal: true,
        }}
        onClose={() => setOpen(false)}
        open={open}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        title="Copied"
      >
        <CopyToClipboard text={value} onCopy={() => setOpen(true)}>
          <IconButton>
            <i className="fas fa-paste" />
          </IconButton>
        </CopyToClipboard>
      </Tooltip>
    </ClickAwayListener>
  )
}
