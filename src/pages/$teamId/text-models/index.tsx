import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$teamId/text-models/')({
  component: () => <div>Hello /$teamId/text-models/!</div>
})