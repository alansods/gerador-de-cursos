import { CourseEditorProvider } from '@/context/CourseEditorContext'
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper'
import { QueryProvider } from '@/components/QueryProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProviderWrapper>
        <CourseEditorProvider>{children}</CourseEditorProvider>
      </AuthProviderWrapper>
    </QueryProvider>
  )
}
