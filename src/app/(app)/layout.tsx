import { CourseEditorProvider } from '@/context/CourseEditorContext'
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper'
import { QueryProvider } from '@/components/QueryProvider'
import { GenerationBannerProvider } from '@/context/GenerationBannerContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <GenerationBannerProvider>
        <AuthProviderWrapper>
          <CourseEditorProvider>{children}</CourseEditorProvider>
        </AuthProviderWrapper>
      </GenerationBannerProvider>
    </QueryProvider>
  )
}
