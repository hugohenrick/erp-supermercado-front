import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  alpha,
  useTheme
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  title,
  content,
  onCancel,
  onConfirm,
  loading = false
}) => {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      PaperProps={{
        elevation: 0,
        sx: {
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          borderRadius: 2,
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.divider, 0.5)}`,
          overflow: 'hidden',
          maxWidth: 450
        }
      }}
    >
      <DialogTitle 
        id="delete-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.error.main,
          fontWeight: 600,
          pb: 1
        }}
      >
        <DeleteForeverIcon color="error" />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText 
          id="delete-dialog-description"
          sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 1,
            mb: 2,
            color: theme.palette.text.primary
          }}
        >
          <WarningIcon 
            sx={{ 
              color: theme.palette.warning.main, 
              mt: 0.5
            }} 
            fontSize="small"
          />
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onCancel}
          disabled={loading}
          sx={{ 
            borderRadius: 2, 
            px: 3,
            fontWeight: 500
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? null : <DeleteForeverIcon />}
          sx={{ 
            borderRadius: 2, 
            px: 3,
            fontWeight: 500
          }}
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog; 