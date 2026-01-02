import { useState, forwardRef } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { IconButton, Snackbar } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface CopyButtonProps {
  value: string
}

// Workaround for React 18 type incompatibility with react-copy-to-clipboard
const CopyToClipboardCompat = CopyToClipboard as any

// Create a forwardRef wrapper for the IconButton
const CopyIconButton = forwardRef<HTMLButtonElement, { onClick?: () => void }>(
  (props, ref) => (
    <IconButton
      ref={ref}
      size="small"
      sx={{
        color: 'rgba(255, 255, 255, 0.6)',
        '&:hover': {
          color: '#4aa564',
          background: 'rgba(74, 165, 100, 0.1)',
        },
      }}
      {...props}
    >
      <ContentCopyIcon fontSize="small" />
    </IconButton>
  )
)

CopyIconButton.displayName = 'CopyIconButton'

export const CopyButton = ({ value }: CopyButtonProps) => {
  const [open, setOpen] = useState(false)

  const handleCopy = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <CopyToClipboardCompat text={value} onCopy={handleCopy}>
        <CopyIconButton />
      </CopyToClipboardCompat>
      <Snackbar
        open={open}
        autoHideDuration={1500}
        onClose={handleClose}
        message="Copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: 'rgba(74, 165, 100, 0.95)',
            color: '#fff',
            fontFamily: '"IBM Plex Sans", sans-serif',
          },
        }}
      />
    </>
  )
}
