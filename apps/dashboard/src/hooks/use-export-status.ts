// Disabled - trigger.dev
// import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect, useState } from "react";

type UseExportStatusProps = {
  runId?: string;
  accessToken?: string;
};

export function useExportStatus({
  runId: initialRunId,
  accessToken: initialAccessToken,
}: UseExportStatusProps = {}) {
  const [accessToken, setAccessToken] = useState<string | undefined>(
    initialAccessToken,
  );
  const [runId, setRunId] = useState<string | undefined>(initialRunId);
  const [status, setStatus] = useState<
    "FAILED" | "IN_PROGRESS" | "COMPLETED" | null
  >(null);

  const [_, setProgress] = useState<number>(0);

  const [result, setResult] = useState<any>(null);

  // Disabled - trigger.dev
  // const { run, error } = useRealtimeRun(runId, {
  //   enabled: !!runId && !!accessToken,
  //   accessToken,
  // });

  useEffect(() => {
    if (initialRunId && initialAccessToken) {
      setAccessToken(initialAccessToken);
      setRunId(initialRunId);
      // Disabled - trigger.dev - stub returns completed status
      setStatus("COMPLETED");
    }
  }, [initialRunId, initialAccessToken]);

  // Disabled - trigger.dev - removed run/error dependency effects
  // useEffect(() => {
  //   if (error || run?.status === "FAILED") {
  //     setStatus("FAILED");
  //     setProgress(0);
  //   }

  //   if (run?.status === "COMPLETED") {
  //     setStatus("COMPLETED");
  //     setProgress(100);
  //   }
  // }, [error, run]);

  // useEffect(() => {
  //   if (run?.output) {
  //     setResult(run.output);
  //   }
  // }, [run]);

  return {
    status,
    setStatus,
    progress: 0, // Disabled - trigger.dev - stub returns 0
    result,
  };
}
