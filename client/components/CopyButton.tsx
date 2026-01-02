import { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material'

interface CopyButtonProps {
  value: string
}

// Workaround for React 18 type incompatibility with react-copy-to-clipboard
const CopyToClipboardCompat = CopyToClipboard as any

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
        <CopyToClipboardCompat text={value} onCopy={() => setOpen(true)}>
          <IconButton>
            <i className="fas fa-paste" />
          </IconButton>
        </CopyToClipboardCompat>
      </Tooltip>
    </ClickAwayListener>
  )
}
