import { researchRouteLoaders } from './route-registry.ts';

export const researchHostContractVersion = 2;
export type ResearchHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type ResearchRoute = Partial<Record<ResearchHttpMethod, (request: Request, context: never) => Response | Promise<Response>>>;

/** Cave authorizes and checks activation before calling this package boundary. */
export async function dispatchResearchRequest(
  route: string,
  method: ResearchHttpMethod,
  request: Request,
  context?: unknown,
): Promise<Response> {
  if (!Object.hasOwn(researchRouteLoaders, route)) return Response.json({ ok: false, error: 'Research route not found' }, { status: 404 });
  const module = await researchRouteLoaders[route as keyof typeof researchRouteLoaders]();
  const handler = (module as ResearchRoute)[method];
  if (!handler) return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
  return handler(request, context as never);
}

/** Import workers only after the host has explicitly activated Research. */
export async function startResearchRuntime(): Promise<void> {
  const { startResearchMediaJobs } = await import('./lib/server/research-media-jobs.ts');
  await startResearchMediaJobs();
}

/** Optional snapshot enrichment; the host keeps basic saved-link operations. */
export async function fetchGithubRepoSnapshot(input: {
  owner: string; repo: string; ref?: string; token: string | null;
}) {
  const { fetchGithubRepoView } = await import('./lib/server/research-github-repo.ts');
  return fetchGithubRepoView(input);
}
