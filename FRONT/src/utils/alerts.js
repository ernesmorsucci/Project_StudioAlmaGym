import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const almaSwal = Swal.mixin({
  background: '#FFFFFF',
  color: '#333333',
  confirmButtonColor: '#7A8B76',
  cancelButtonColor: '#E07A5F',
  buttonsStyling: true,
  customClass: {
    popup: 'alma-swal-popup',
    title: 'alma-swal-title',
    htmlContainer: 'alma-swal-text',
    confirmButton: 'alma-swal-confirm',
    cancelButton: 'alma-swal-cancel',
    actions: 'alma-swal-actions',
  },
});

export const showAlert = ({ title = 'Aviso', text, icon = 'info', confirmButtonText = 'Entendido' }) => {
  return almaSwal.fire({
    title,
    text,
    icon,
    confirmButtonText,
  });
};

export const showSuccess = (text, title = 'Listo') => {
  return showAlert({ title, text, icon: 'success' });
};

export const showError = (text, title = 'Algo salió mal') => {
  return showAlert({ title, text, icon: 'error' });
};

export const showWarning = (text, title = 'Atención') => {
  return showAlert({ title, text, icon: 'warning' });
};

export const showConfirm = async ({
  title = '¿Confirmás esta acción?',
  text,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  icon = 'question',
  confirmButtonColor = '#7A8B76',
}) => {
  const result = await almaSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor,
  });

  return result.isConfirmed;
};
