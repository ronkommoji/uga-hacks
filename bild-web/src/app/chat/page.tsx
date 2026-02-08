import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const project = params.project ? `?project=${params.project}` : "";
  redirect(`/bob${project}`);
}
