import { useHazeData } from '@/hooks/useHazeData';
import { HazeReadings } from '@/components/HazeReadings';
import { formatTimestamp } from '@/lib/hazeFormat';
import { CHALLENGE_NAME } from '@/config';

export default function TeaserPage() {
  const { data, loading, error } = useHazeData();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs font-medium text-muted-foreground mb-2">{CHALLENGE_NAME}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">Step Challenge Paused</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          With haze conditions in Singapore, NEA is advising against prolonged outdoor activity. We're pausing the
          step challenge for everyone's safety. Your team's progress and scores aren't affected, and the challenge
          will resume once conditions improve.
        </p>

        {error && (
          <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-4 mb-4 text-sm text-muted-foreground">
            {error} Check the latest readings directly at{' '}
            <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="text-foreground underline">
              haze.gov.sg
            </a>
            .
          </div>
        )}

        {loading && !data && (
          <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-6 mb-4 text-sm text-muted-foreground text-center">
            Loading current readings…
          </div>
        )}

        {data && (
          <>
            <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-3 mb-4">
              <HazeReadings psi={data.psi} pm25={data.pm25} />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Readings as of {formatTimestamp(data.officialUpdatedAt)}
              {' '}· Source:{' '}
              <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline">
                haze.gov.sg
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
