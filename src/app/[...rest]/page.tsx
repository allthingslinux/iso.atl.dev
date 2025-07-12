import { type Metadata, type ResolvedMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GetBanner, GetFile, GetReadme, ListFiles } from "@/actions/files";
import { ValidatePaths } from "@/actions/paths";

import { getFileType } from "@/lib/previewHelper";
import { formatPathToBreadcrumb } from "@/lib/utils";

import {
  FileBreadcrumb,
  FileExplorerLayout,
  FileReadme,
} from "@/components/explorer";
import { Error as ErrorComponent } from "@/components/layout";
import { PreviewLayout } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export const revalidate = 3600;
export const dynamic = "force-static";

type Props = {
  params: Promise<{
    rest: string[];
  }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvedMetadata
): Promise<Metadata> {
  const { rest } = await params;

  const paths = await ValidatePaths(rest);
  if (!paths.success) return { title: "Not Found" };

  const currentPath = paths.data.pop();
  if (!currentPath?.id) return { title: "Not Found" };

  const banner = await GetBanner(currentPath.id);

  return {
    title: decodeURIComponent(currentPath.path),
    description: currentPath.mimeType.includes("folder")
      ? `Browse ${currentPath.path} files`
      : `View ${currentPath.path}`,
    openGraph: {
      images: banner.success
        ? [
            {
              url: `/api/og/${banner.data}`,
              width: 1200,
              height: 630,
            },
          ]
        : parent.openGraph?.images,
    },
  };
}
export default async function RestPage({ params }: Props) {
  const { rest } = await params;

  const paths = await ValidatePaths(rest);
  if (!paths.success) notFound();

  const currentPath = paths.data[paths.data.length - 1];
  if (!currentPath)
    return <ErrorComponent error={new Error("Failed to get current path")} />;

  const prevPath = `/${rest.slice(0, -1).join("/")}`;

  const Layout: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => (
    <div className="flex h-fit w-full flex-col gap-4">
      <FileBreadcrumb data={formatPathToBreadcrumb(paths.data)} />

      <section slot="content" className="w-full">
        {children}
      </section>
    </div>
  );

  if (currentPath.mimeType.includes("folder")) {
    const [data, readme] = await Promise.all([
      ListFiles({ id: currentPath.id }),
      GetReadme(currentPath.id),
    ]);
    if (!data.success) return <ErrorComponent error={new Error(data.error)} />;
    if (!readme.success)
      return <ErrorComponent error={new Error(readme.error)} />;

    return (
      <Layout>
        <Card>
          <CardHeader className="pb-0">
            <div className="relative flex w-full items-center justify-between gap-4">
              <Button variant="outline" asChild>
                <Link href={prevPath}>
                  <Icon name="ArrowLeft" size="1rem" className="mr-2" />
                  Back
                </Link>
              </Button>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                <CardTitle>Browse files</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-2 pt-0 tablet:p-4 tablet:pt-0">
            <FileExplorerLayout
              encryptedId={currentPath.id}
              files={data.data.files}
              nextPageToken={data.data.nextPageToken ?? undefined}
            />
          </CardContent>
        </Card>

        {readme.data && (
          <FileReadme
            content={readme.data.content}
            title={`README.${readme.data.type === "markdown" ? "md" : "txt"}`}
          />
        )}
      </Layout>
    );
  }

  const file = await GetFile(currentPath.id);
  if (!file.success) {
    if (file.error === "NotFound") notFound();
    return <ErrorComponent error={new Error(file.error)} />;
  }
  if (!file.data)
    return <ErrorComponent error={new Error("Failed to get file data")} />;

  return (
    <Layout>
      <PreviewLayout
        data={file.data}
        fileType={
          file.data?.fileExtension && file.data?.mimeType
            ? getFileType(file.data.fileExtension, file.data.mimeType)
            : "unknown"
        }
        paths={rest}
      />
    </Layout>
  );
}
