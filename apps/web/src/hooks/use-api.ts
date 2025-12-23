import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Types
type SearchResult = {
  id: number;
  filename: string;
  version: string | null;
  arch: string | null;
  edition: string | null;
  spin: string | null;
  isoType: string | null;
  releaseStage: string | null;
  libc: string | null;
  initSystem: string | null;
  hardwareTarget: string | null;
  language: string | null;
  size: number | null;
  status: string | null;
  distroSlug: string | null;
  distroName: string | null;
  distroOsType: string | null;
  familySlug: string | null;
  familyName: string | null;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
};

type Family = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  distroCount: number;
};

type Distribution = {
  id: number;
  slug: string;
  name: string;
  osType: string;
  familySlug: string | null;
  familyName: string | null;
  parentId: number | null;
  isoCount: number;
};

type SearchParams = {
  q?: string;
  distro?: string;
  family?: string;
  osType?: string;
  arch?: string;
  edition?: string;
  spin?: string;
  isoType?: string;
  releaseStage?: string;
  libc?: string;
  initSystem?: string;
  hardwareTarget?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type ReputationResponse = {
  reputation: number;
  rank: string;
  editsSubmitted: number;
  editsApproved: number;
};

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  return entries.length
    ? `?${new URLSearchParams(entries as [string, string][]).toString()}`
    : "";
}

// Catalog hooks
export function useSearch(params: SearchParams = {}) {
  const qs = buildQueryString(params);
  return useQuery({
    queryKey: ["catalog", "search", params],
    queryFn: () => api.get<SearchResponse>(`/catalog/search${qs}`),
  });
}

export function useFamilies() {
  return useQuery({
    queryKey: ["catalog", "families"],
    queryFn: () => api.get<Family[]>("/catalog/families"),
  });
}

export function useDistributions() {
  return useQuery({
    queryKey: ["catalog", "distributions"],
    queryFn: () => api.get<Distribution[]>("/catalog/distributions"),
  });
}

// Library hooks
type IsoDetail = {
  id: number;
  filename: string;
  driveId: string;
  version: string | null;
  arch: string | null;
  edition: string | null;
  spin: string | null;
  isoType: string | null;
  releaseStage: string | null;
  releaseDate: string | null;
  libc: string | null;
  initSystem: string | null;
  hardwareTarget: string | null;
  kernelVersion: string | null;
  language: string | null;
  size: number | null;
  checksumMd5: string | null;
  checksumSha1: string | null;
  checksumSha256: string | null;
  status: string | null;
  confidenceScore: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  distroId: number;
  distroSlug: string;
  distroName: string;
  distroOsType: string;
  distroWebsite: string | null;
  familySlug: string | null;
  familyName: string | null;
};

type DistroDetail = {
  id: number;
  slug: string;
  name: string;
  osType: string;
  family: { id: number; slug: string; name: string } | null;
  parent: { slug: string; name: string } | null;
  children: { slug: string; name: string }[];
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  isoCount: number;
};

export function useIso(id: number) {
  return useQuery({
    queryKey: ["library", "iso", id],
    queryFn: () => api.get<IsoDetail>(`/library/isos/${id}`),
    enabled: !!id,
  });
}

export function useDistro(slug: string) {
  return useQuery({
    queryKey: ["library", "distro", slug],
    queryFn: () => api.get<DistroDetail>(`/library/distros/${slug}`),
    enabled: !!slug,
  });
}

// Curation hooks
export function useReputation(userId: string) {
  return useQuery({
    queryKey: ["curation", "reputation", userId],
    queryFn: () =>
      api.get<ReputationResponse>(`/curation/users/${userId}/reputation`),
    enabled: !!userId,
  });
}

// Pending ISOs for staging
export function usePendingIsos() {
  const { data, ...rest } = useSearch({ status: "pending" });
  return { data: data?.results, ...rest };
}

// Update ISO status (for curation)
export function useUpdateIso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      status: string;
      reviewedBy: string;
    }) => api.patch(`/library/isos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

// Activity hooks
type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  actor: { userId: string; username: string | null } | null;
};

type ActivityResponse = {
  items: ActivityItem[];
  total: number;
  page: number;
  limit: number;
};

type ActivityParams = {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  page?: number;
  limit?: number;
};

export function useActivity(params: ActivityParams = {}) {
  const qs = buildQueryString(params);
  return useQuery({
    queryKey: ["activity", params],
    queryFn: () => api.get<ActivityResponse>(`/activity${qs}`),
  });
}
