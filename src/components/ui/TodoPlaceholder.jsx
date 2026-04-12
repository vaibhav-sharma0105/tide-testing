import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

export default function TodoPlaceholder({ message }) {
  const { t } = useTranslation()
  return (
    <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      <p className="text-xs font-body text-amber-700">
        <span className="font-semibold">{t('todo.label')}:</span>{' '}
        {message || t('todo.message')}
      </p>
    </div>
  )
}
