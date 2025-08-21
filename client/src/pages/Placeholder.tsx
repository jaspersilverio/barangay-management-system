export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}


