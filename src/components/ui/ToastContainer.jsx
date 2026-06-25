import { useToast } from '../../contexts/ToastContext';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
