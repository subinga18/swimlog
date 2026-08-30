import { SwimApp } from '@/components/swim-app'

type SearchParams = Promise<{
  url?: string | string[]
  text?: string | string[]
  title?: string | string[]
}>

function first(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  return (
    <SwimApp
      initialUrl={first(sp.url)}
      initialText={first(sp.text)}
      initialTitle={first(sp.title)}
    />
  )
}
