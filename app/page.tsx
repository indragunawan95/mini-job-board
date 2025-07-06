import BrowseJobs from "@/components/browse-jobs"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <BrowseJobs mode="public"/>
    </main>
  );
}
